// Cross-device settings store backed by Supabase `app_settings` (jsonb) with a
// localStorage mirror so the UI works offline and during the migration window.
//
// Optimistic-locking: every load returns the row's `updated_at`; saves include
// it as `expectedUpdatedAt` and the row only gets written if Supabase still
// reports the same value (a stale save is rejected with a `staleConflict` flag
// so callers can prompt the user to reload).

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_PREFIX = "trout-lake-";
const eventName = (key: string) => `app-setting:${key}:changed`;

// Track the version (server `updated_at`) of the last loaded value per key so
// saves can detect if another device snuck a newer write in between.
const versionByKey = new Map<string, string | null>();

/** Read a setting. Tries Supabase first, falls back to localStorage, then defaults. */
export async function loadAppSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{
              data: { value: T; updated_at?: string } | null;
              error: Error | null;
            }>;
          };
        };
      };
    })
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", key)
      .maybeSingle();
    if (!error && data?.value) {
      versionByKey.set(key, data.updated_at ?? null);
      const merged = mergeShallow(defaultValue, data.value);
      try {
        window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(merged));
      } catch { /* quota / private mode */ }
      return merged;
    }
    // No row yet — record null so the first save can write unconditionally.
    if (!error) versionByKey.set(key, null);
  } catch (err) {
    console.warn(`app_settings load (${key}) failed, using local fallback:`, err);
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
      if (raw) return mergeShallow(defaultValue, JSON.parse(raw));
    } catch { /* malformed json */ }
  }
  return defaultValue;
}

/**
 * Write a setting.
 *  - Mirrors locally first (instant feedback).
 *  - Then upserts to Supabase using an optimistic `updated_at` check: if another
 *    device wrote since we last loaded, the upsert refuses and we return
 *    `{ remote: false, staleConflict: true }` so the caller can prompt a reload.
 */
export async function saveAppSetting<T>(
  key: string,
  value: T
): Promise<{ remote: boolean; staleConflict?: boolean }> {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(eventName(key), { detail: value }));
  }
  try {
    const expectedUpdatedAt = versionByKey.get(key);

    if (expectedUpdatedAt === undefined) {
      // We've never loaded this key — fetch the current row so we know the
      // version to compare against. Skip if no row exists yet.
      const probe = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              col: string,
              v: string
            ) => {
              maybeSingle: () => Promise<{
                data: { updated_at?: string } | null;
                error: Error | null;
              }>;
            };
          };
        };
      })
        .from("app_settings")
        .select("updated_at")
        .eq("key", key)
        .maybeSingle();
      versionByKey.set(key, probe.data?.updated_at ?? null);
    }

    const expected = versionByKey.get(key);

    // Branch 1 — no existing row. Plain upsert is fine; no-one else has it yet.
    if (expected == null) {
      const ins = await (supabase as unknown as {
        from: (t: string) => {
          upsert: (
            row: Record<string, unknown>,
            opts?: { onConflict?: string }
          ) => {
            select: (c: string) => Promise<{ data: { updated_at?: string }[] | null; error: Error | null }>;
          };
        };
      })
        .from("app_settings")
        .upsert({ key, value }, { onConflict: "key" })
        .select("updated_at");
      if (ins.error) {
        console.warn(`app_settings save (${key}) failed:`, ins.error);
        return { remote: false };
      }
      versionByKey.set(key, ins.data?.[0]?.updated_at ?? null);
      return { remote: true };
    }

    // Branch 2 — row exists. UPDATE only when updated_at still matches what we read.
    const upd = await (supabase as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (
            col: string,
            v: string
          ) => {
            eq: (col: string, v: string) => {
              select: (c: string) => Promise<{
                data: { updated_at?: string }[] | null;
                error: Error | null;
              }>;
            };
          };
        };
      };
    })
      .from("app_settings")
      .update({ value })
      .eq("key", key)
      .eq("updated_at", expected)
      .select("updated_at");
    if (upd.error) {
      console.warn(`app_settings save (${key}) failed:`, upd.error);
      return { remote: false };
    }
    if (!upd.data || upd.data.length === 0) {
      // No rows updated — someone else wrote since our last load.
      console.warn(`app_settings save (${key}) STALE — another device wrote first.`);
      return { remote: false, staleConflict: true };
    }
    versionByKey.set(key, upd.data[0]?.updated_at ?? null);
    return { remote: true };
  } catch (err) {
    console.warn(`app_settings save (${key}) threw:`, err);
    return { remote: false };
  }
}

/**
 * Reactive hook — re-renders on save AND on cross-device changes.
 *
 * Cross-device sync sources, in priority order:
 *   1. Same-tab CustomEvent (instant — when this tab calls saveAppSetting)
 *   2. Same-browser cross-tab StorageEvent (instant — localStorage mirror change)
 *   3. Tab-visibility change (when the user switches back from another browser
 *      / device, we refetch to catch what changed while we were idle)
 *   4. Periodic poll while the tab is visible (every 60s) — catches changes
 *      that happen on another device while this tab is active too
 *
 * Polling stops when the tab is hidden so we don't burn function invocations
 * for a tab the user isn't looking at.
 */
const POLL_INTERVAL_MS = 60_000;

export function useAppSetting<T>(key: string, defaultValue: T): T {
  const [val, setVal] = useState<T>(defaultValue);
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const valRef = useRef<T>(defaultValue);
  valRef.current = val;

  useEffect(() => {
    let alive = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const refetch = () => {
      loadAppSetting<T>(key, defaultRef.current).then((v) => {
        if (!alive) return;
        // Only update if the value actually changed — avoids re-renders that
        // would otherwise reset focus / scroll on every poll tick.
        try {
          if (JSON.stringify(v) !== JSON.stringify(valRef.current)) setVal(v);
        } catch {
          setVal(v);
        }
      });
    };

    refetch();

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<T>).detail;
      if (detail !== undefined) setVal(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_PREFIX + key && e.newValue) {
        try {
          setVal(mergeShallow(defaultRef.current, JSON.parse(e.newValue)));
        } catch { /* ignore */ }
      }
    };
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") refetch();
    };

    // Set up the periodic poll only while the tab is visible.
    const startPoll = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (document.visibilityState === "visible") refetch();
      }, POLL_INTERVAL_MS);
    };
    const stopPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startPoll();
    }

    const onVisibilityChange = () => {
      onVisibilityOrFocus();
      if (document.visibilityState === "visible") startPoll();
      else stopPoll();
    };

    window.addEventListener(eventName(key), onChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      stopPoll();
      window.removeEventListener(eventName(key), onChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [key]);

  return val;
}

function mergeShallow<T>(base: T, override: unknown): T {
  if (base && typeof base === "object" && !Array.isArray(base) && override && typeof override === "object") {
    return { ...(base as object), ...(override as object) } as T;
  }
  return (override as T) ?? base;
}
