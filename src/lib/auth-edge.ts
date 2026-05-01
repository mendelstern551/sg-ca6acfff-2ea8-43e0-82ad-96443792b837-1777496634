// Edge-runtime-compatible session verifier — used from middleware where
// `node:crypto` isn't available. Uses Web Crypto subtle.verify with
// HMAC-SHA256, matching the signature scheme in `auth-server.ts`.

export const SESSION_COOKIE = "tlr_session";

interface SessionPayload {
  email: string;
  exp: number;
}

function base64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const fixed = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(fixed);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(buf: Uint8Array): string {
  return new TextDecoder("utf-8").decode(buf);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8Encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/** Returns the session payload if the cookie is well-formed, signed, and unexpired. */
export async function verifySessionEdge(
  token: string | undefined | null,
  secret: string | undefined
): Promise<SessionPayload | null> {
  if (!token || !secret || secret.length < 16) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let signature: Uint8Array;
  try {
    signature = base64urlDecode(sig);
  } catch {
    return null;
  }
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    utf8Encode(body)
  );
  if (!ok) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(utf8Decode(base64urlDecode(body)));
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
