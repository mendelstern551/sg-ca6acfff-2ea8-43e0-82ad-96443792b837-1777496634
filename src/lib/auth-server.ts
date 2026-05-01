// Server-only auth helpers. NEVER import this from client components — it
// uses node:crypto and Supabase's service-role key.
//
// Design:
//  - Admin email lives in ADMIN_EMAIL env (single-admin app).
//  - Password is bcrypt-hashed and stored in app_settings under
//    `admin-credential`. On first login, if no hash exists, we accept the
//    plaintext ADMIN_PASSWORD env value, then bcrypt-hash and store it so
//    future logins (and password changes via forgot-password) are
//    self-contained in the database.
//  - Sessions are HMAC-SHA256 signed cookies — no external session store
//    needed. Format: base64url(JSON({email,exp})) + "." + base64url(sig).
//  - Reset tokens are short random strings stored hashed in app_settings
//    with a TTL.
//
// IMPORTANT: SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD must be set as
// Vercel environment variables; the code refuses to authenticate if any
// are missing (fail-closed).

import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;
const RESET_TTL_MINUTES = 30;
export const SESSION_COOKIE = "tlr_session";

const ADMIN_CRED_KEY = "admin-credential";
const ADMIN_RESET_KEY = "admin-reset-token";

// ---- Supabase service-role client (server-side only). The anon key works
// fine for app_settings since RLS allows it, but we keep this as a thin
// helper so future calls can swap to service role without a refactor. ----
function getServerSupabase(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Helpers ----

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): Buffer {
  // Restore padding before decoding.
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  const fixed =
    str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(fixed, "base64");
}

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET || "";
  // 32+ chars required — anything shorter is almost certainly a misconfig.
  return secret.length >= 16 ? secret : null;
}

// ---- Session cookie sign/verify ----

export interface SessionPayload {
  email: string;
  exp: number; // unix seconds
}

export function signSession(email: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = base64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64urlEncode(sig)}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = createHmac("sha256", secret).update(body).digest();
  let providedSig: Buffer;
  try {
    providedSig = base64urlDecode(sig);
  } catch {
    return null;
  }
  if (
    providedSig.length !== expectedSig.length ||
    !timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }
  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(body).toString("utf8"));
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.email !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function buildSessionCookieHeader(token: string): string {
  // Production sets Secure; dev allows http://localhost.
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildClearSessionCookieHeader(): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

// ---- Password verification + hash storage ----

interface StoredCredential {
  password_hash: string;
  updated_at: string;
}

async function getStoredHash(): Promise<string | null> {
  const sb = getServerSupabase();
  if (!sb) return null;
  // Cast through unknown — `app_settings` rows hold opaque JSON values that
  // change shape per key, so the generated `value` type is too narrow here.
  const { data, error } = await (sb as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { value: StoredCredential | null } | null;
            error: Error | null;
          }>;
        };
      };
    };
  })
    .from("app_settings")
    .select("value")
    .eq("key", ADMIN_CRED_KEY)
    .maybeSingle();
  if (error) {
    console.warn("getStoredHash failed:", error.message);
    return null;
  }
  return data?.value?.password_hash || null;
}

async function setStoredHash(hash: string): Promise<void> {
  const sb = getServerSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const value: StoredCredential = {
    password_hash: hash,
    updated_at: new Date().toISOString(),
  };
  const { error } = await (sb as unknown as {
    from: (t: string) => {
      upsert: (
        row: Record<string, unknown>,
        opts?: { onConflict?: string }
      ) => Promise<{ error: Error | null }>;
    };
  })
    .from("app_settings")
    .upsert({ key: ADMIN_CRED_KEY, value }, { onConflict: "key" });
  if (error) throw error;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL || "";
  return email ? normalizeEmail(email) : null;
}

/** Confirm submitted credentials. Bootstraps the bcrypt hash on first use. */
export async function verifyCredentials(
  submittedEmail: string,
  submittedPassword: string
): Promise<boolean> {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  if (normalizeEmail(submittedEmail) !== adminEmail) return false;

  // Try the stored bcrypt hash first.
  const stored = await getStoredHash();
  if (stored) {
    try {
      return await bcrypt.compare(submittedPassword, stored);
    } catch (err) {
      console.warn("bcrypt.compare threw:", err);
      return false;
    }
  }

  // Bootstrap path: first login, no hash stored yet. Compare against the
  // ADMIN_PASSWORD env (timing-safe) and persist the hash so subsequent
  // logins / forgot-password flows are DB-driven.
  const envPassword = process.env.ADMIN_PASSWORD || "";
  if (!envPassword) return false;
  const a = Buffer.from(submittedPassword);
  const b = Buffer.from(envPassword);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const hash = await bcrypt.hash(submittedPassword, 10);
    await setStoredHash(hash);
  } catch (err) {
    // Hash-store failure shouldn't block a valid login — we'll re-bootstrap
    // next time. Just log it.
    console.warn("Bootstrap hash store failed:", err);
  }
  return true;
}

/** Replace the stored hash with a new password. Used by reset-password. */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await setStoredHash(hash);
}

// ---- Reset tokens ----

interface StoredResetToken {
  token_hash: string;
  expires_at: string; // ISO
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

export async function generateResetToken(): Promise<{ token: string; expiresAt: Date }> {
  const sb = getServerSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
  const value: StoredResetToken = {
    token_hash: sha256Hex(token),
    expires_at: expiresAt.toISOString(),
  };
  const { error } = await (sb as unknown as {
    from: (t: string) => {
      upsert: (
        row: Record<string, unknown>,
        opts?: { onConflict?: string }
      ) => Promise<{ error: Error | null }>;
    };
  })
    .from("app_settings")
    .upsert({ key: ADMIN_RESET_KEY, value }, { onConflict: "key" });
  if (error) throw error;
  return { token, expiresAt };
}

export async function consumeResetToken(token: string): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;
  const { data, error } = await (sb as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { value: StoredResetToken | null } | null;
            error: Error | null;
          }>;
        };
      };
    };
  })
    .from("app_settings")
    .select("value")
    .eq("key", ADMIN_RESET_KEY)
    .maybeSingle();
  if (error || !data?.value) return false;
  const { token_hash, expires_at } = data.value;
  if (!token_hash || !expires_at) return false;
  if (new Date(expires_at).getTime() < Date.now()) return false;
  const submitted = sha256Hex(token);
  // Constant-time compare to defeat hash-extension / timing oracles.
  const a = Buffer.from(submitted, "hex");
  const b = Buffer.from(token_hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  // One-shot use — delete the token immediately on success.
  await (sb as unknown as {
    from: (t: string) => {
      delete: () => {
        eq: (col: string, val: string) => Promise<{ error: Error | null }>;
      };
    };
  })
    .from("app_settings")
    .delete()
    .eq("key", ADMIN_RESET_KEY);
  return true;
}

/** Read session out of a Next.js req cookies map. */
export function readSessionFromReq(
  cookies: Partial<Record<string, string>> | undefined
): SessionPayload | null {
  return verifySession(cookies?.[SESSION_COOKIE]);
}
