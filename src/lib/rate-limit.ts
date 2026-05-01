// Lightweight in-memory rate limiter for Next.js API routes.
//
// Limits are per-key (typically IP address). Each key has a window with a
// max count; once exceeded, requests are rejected until the window resets.
// State lives in module scope, which means each serverless instance has its
// own counter — that's a known trade-off vs. a shared KV store. For a
// single-admin app it raises brute-force cost from ~zero to "the attacker
// must spread across many cold-start instances", which is plenty.
//
// Old buckets are cleaned up lazily so memory doesn't grow without bound.

interface Bucket {
  count: number;
  resetAt: number; // unix ms
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED = 5_000; // hard cap so we can't OOM the lambda

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();

  // Lazy GC — only when we're at the cap.
  if (buckets.size > MAX_TRACKED) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
      if (buckets.size <= MAX_TRACKED / 2) break;
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, opts.max - bucket.count);
  const ok = bucket.count <= opts.max;

  return {
    ok,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Pull a "best effort" client IP from the request headers / socket. */
export function clientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    // First entry is the originating client.
    return xff.split(",")[0].trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real;
  return req.socket?.remoteAddress || "unknown";
}
