// Browser-side Supabase client. Notably:
//   - URL is `/api/db` on the SAME ORIGIN, not the real Supabase host.
//   - The "anon key" passed in is a placeholder — the actual auth happens
//     at /api/db (session-cookie check + service-role key on the server).
//
// Net effect: opening DevTools → Network shows only requests to
// admin.troutlakeresort.ca/api/db/rest/v1/... — the real Supabase host
// name and the anon key never appear in the bundle or in network logs.
//
// On the SERVER (API routes), `createClient` is called with the real URL
// + service-role key in lib/auth-server.ts. Don't import this `supabase`
// from server-only code; use a server-side client there.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Resolve the proxy origin. In the browser we use a relative URL so the
// cookie/origin always matches what the user is on (works for production,
// previews, custom domains). On the server (where this file shouldn't be
// used directly anyway) we synthesize a localhost URL just so createClient
// doesn't throw — server code should use the auth-server helper instead.
function getProxyBase(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/db`;
  }
  return "http://localhost:3000/api/db";
}

// The Supabase JS client always sends an `apikey` header. Our proxy
// strips it and substitutes the real service-role key, so this value is
// never trusted — but it must be non-empty or createClient throws.
const PLACEHOLDER_KEY = "session-cookie";

export const supabase = createClient<Database>(getProxyBase(), PLACEHOLDER_KEY, {
  auth: {
    // We don't use Supabase Auth — auth is via our own session cookie.
    // Disable token refresh + persistence so the client doesn't try to
    // talk to /auth/v1/ which the proxy doesn't allow.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
