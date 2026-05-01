// Same-origin reverse proxy for Supabase. Browser code talks to this
// endpoint as if it were Supabase itself; we forward to the real Supabase
// host using SUPABASE_SERVICE_ROLE_KEY and pass back the response.
//
// Why: previously the client embedded the public Supabase URL +
// NEXT_PUBLIC_SUPABASE_ANON_KEY in the JS bundle and called Supabase
// directly. DevTools showed every REST call, the host name, and the
// anon key — so anyone could grab the key and run their own queries.
//
// After this proxy lands:
//   - DevTools shows only `/api/db/rest/v1/...` calls to the same origin
//   - The Supabase URL never appears in the client bundle
//   - The anon key never appears in the client bundle
//   - Every call requires a valid admin session cookie (verified here
//     and again by middleware as defense in depth)
//   - The proxy uses the service-role key, which bypasses RLS — so we
//     don't depend on Supabase RLS policies for security; the session
//     check above is the only gate

import type { NextApiRequest, NextApiResponse } from "next";
import { readSessionFromReq } from "@/lib/auth-server";

// Strip Vercel/Next/security headers that don't belong on the upstream
// request, plus the client-supplied apikey/authorization (the proxy
// uses its own service-role credentials).
const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding", // let upstream pick its own encoding
  "apikey",
  "authorization",
  "cookie", // we're already authenticated via session — don't forward
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip",
  "x-vercel-id",
  "x-vercel-deployment-url",
  "x-vercel-forwarded-for",
  "x-vercel-internal-ingress",
  "x-vercel-ip-as-number",
  "x-vercel-ip-city",
  "x-vercel-ip-continent",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-latitude",
  "x-vercel-ip-longitude",
  "x-vercel-ip-postal-code",
  "x-vercel-ip-timezone",
  "x-vercel-proxy-signature",
  "x-vercel-proxy-signature-ts",
  "x-vercel-proxied-for",
  "x-vercel-sc-host",
  "x-vercel-sc-headers",
  "x-vercel-sc-basepath",
  "forwarded",
  "via",
  "true-client-ip",
  "cdn-loop",
]);

// Strip response headers that would confuse the browser if echoed back.
const STRIP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "content-encoding", // node-fetch already decoded
  "connection",
  "keep-alive",
  "content-length", // recomputed by Next when we write
]);

// Whitelist of upstream API surfaces. Anything else is rejected so a
// future bug in url-construction can't accidentally proxy weird paths
// to Supabase Auth, Edge Functions, etc.
const ALLOWED_PREFIXES = ["rest/v1/", "storage/v1/"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Defense in depth: middleware already checks session for /api/* routes,
  // but if the matcher ever changes we still refuse here.
  const session = readSessionFromReq(req.cookies);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "/api/db: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on server"
    );
    return res.status(500).json({ error: "Backend misconfigured" });
  }

  const pathParam = req.query.path;
  const pathSegments = Array.isArray(pathParam) ? pathParam : [pathParam || ""];
  const subPath = pathSegments.filter(Boolean).join("/");

  if (!ALLOWED_PREFIXES.some((p) => subPath.startsWith(p))) {
    return res.status(404).json({ error: "Not found" });
  }

  // Reconstruct the original query string so PostgREST filters / select=
  // / order= / limit= etc. all pass through unchanged.
  const queryEntries: [string, string][] = [];
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "path") continue;
    if (Array.isArray(v)) {
      for (const item of v) queryEntries.push([k, String(item)]);
    } else if (v !== undefined) {
      queryEntries.push([k, String(v)]);
    }
  }
  const qs = new URLSearchParams(queryEntries).toString();
  const targetUrl = `${supabaseUrl.replace(/\/$/, "")}/${subPath}${qs ? "?" + qs : ""}`;

  // Build outgoing headers. Service-role goes in both apikey AND
  // Authorization, matching what the Supabase JS client normally sends.
  const outHeaders: Record<string, string> = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
  };
  for (const [k, vRaw] of Object.entries(req.headers)) {
    const lower = k.toLowerCase();
    if (STRIP_REQUEST_HEADERS.has(lower)) continue;
    if (vRaw === undefined) continue;
    outHeaders[lower] = Array.isArray(vRaw) ? vRaw.join(", ") : String(vRaw);
  }

  // Body: forward as-is for write methods. Next has already parsed JSON
  // for us via the bodyParser, so re-stringify if we got an object.
  let body: BodyInit | undefined;
  const method = (req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    if (req.body === undefined || req.body === null || req.body === "") {
      body = undefined;
    } else if (typeof req.body === "string") {
      body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      body = req.body;
    } else {
      // JSON fallthrough — most PostgREST writes go through here
      body = JSON.stringify(req.body);
      if (!outHeaders["content-type"]) outHeaders["content-type"] = "application/json";
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: outHeaders,
      body,
      redirect: "manual",
    });
  } catch (err) {
    console.error("/api/db: upstream fetch failed", err);
    return res.status(502).json({ error: "Upstream fetch failed" });
  }

  // Mirror upstream status, headers, body.
  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    // Don't echo back a Set-Cookie from upstream — the session cookie is
    // ours, and Supabase doesn't legitimately set cookies for REST.
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });
  // Always make proxy responses non-cacheable; data is per-user.
  res.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );

  // Stream the body back. For binary (storage) responses, send buffer.
  // For everything else, send arrayBuffer too — works for JSON and HTML
  // alike without trying to guess content type.
  const buf = Buffer.from(await upstream.arrayBuffer());
  res.send(buf);
}

export const config = {
  api: {
    // Accept payloads up to 50 MB so storage uploads (PDFs, images) work.
    bodyParser: { sizeLimit: "50mb" },
    // Don't auto-parse the body for upstream binary uploads; we want
    // raw bytes when content-type isn't JSON.
    // (Next's default still parses JSON; binary requests come in as Buffer.)
    responseLimit: "50mb",
  },
};
