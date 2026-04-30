// Cross-device settings store backed by Supabase `app_settings` (jsonb) with a
// localStorage mirror so the UI works offline and during the migration window.
//
// Usage in components:
//   const config = useAppSetting<PricingConfig>("pricing_config", DEFAULT_PRICING);
//   await saveAppSetting("pricing_config", config);

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_PREFIX = "trout-lake-";
const eventName = (key: string) => `app-setting:${key}:changed`;

/** Read a setting. Tries Supabase first, falls back to localStorage, then defaults. */
export async function loadAppSetting<T>(key: string, defaultValue: T): Promise<T> {
  // Supabase
  try {
    // Cast through any — the new app_settings table isn't in generated types yet.
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { value: T } | null; error: Error | null }>;
          };
        };
      };
    })
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data?.value) {
      const merged = mergeShallow(defaultValue, data.value);
      // Mirror to local for offline + faster next load.
      try {
        window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(merged));
      } catch { /* quota / private mode */ }
      return merged;
    }
  } catch (err) {
    // Fall through to local fallback.
    console.warn(`app_settings load (${key}) failed, using local fallback:`, err);
  }
  // localStorage fallback (also covers the period before the migration is run).
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
      if (raw) return mergeShallow(defaultValue, JSON.parse(raw));
    } catch { /* malformed json */ }
  }
  return defaultValue;
}

/** Write a setting. Mirrors locally first (instant) then upserts to Supabase. */
export async function saveAppSetting<T>(key: string, value: T): Promise<{ remote: boolean }> {
  // Mirror locally so the active tab + other tabs on this device react immediately.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(eventName(key), { detail: value }));
  }
  // Upsert to Supabase (best effort — fail silently if table doesn't exist yet).
  try {
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        upsert: (
          row: Record<string, unknown>,
          opts?: { onConflict?: string }
        ) => Promise<{ error: Error | null }>;
      };
    })
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) {
      console.warn(`app_settings save (${key}) failed:`, error);
      return { remote: false };
    }
    return { remote: true };
  } catch (err) {
    console.warn(`app_settings save (${key}) threw:`, err);
    return { remote: false };
  }
}

/** Reactive hook — re-renders on save (any tab, any device that triggers a window event). */
export function useAppSetting<T>(key: string, defaultValue: T): T {
  const [val, setVal] = useState<T>(defaultValue);
  // Hold the latest defaultValue in a ref so the effect doesn't re-run on every render.
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;

  useEffect(() => {
    let alive = true;
    loadAppSetting<T>(key, defaultRef.current).then((v) => {
      if (alive) setVal(v);
    });
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
    window.addEventListener(eventName(key), onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener(eventName(key), onChange);
      window.removeEventListener("storage", onStorage);
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
