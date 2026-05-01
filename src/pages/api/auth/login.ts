// POST /api/auth/login
// Body: { email: string, password: string }
// On success: 200, sets HttpOnly tlr_session cookie.
// On bad credentials: 401 (deliberately vague message).

import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyCredentials,
  signSession,
  buildSessionCookieHeader,
} from "@/lib/auth-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Brute-force defense: 10 attempts per IP per 10-minute window. Counters
  // live in-memory per serverless instance — see lib/rate-limit.ts.
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSeconds));
    return res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).`,
    });
  }

  const { email, password } = (req.body || {}) as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await verifyCredentials(email, password);
    if (result.ok === false) {
      if (result.reason === "misconfigured") {
        // Don't pretend it's a bad password — the operator needs to know to
        // set the env vars on Vercel. Surfaced verbatim in the UI.
        console.error("login: server misconfigured, missing:", result.missing);
        const plural = result.missing.length > 1 ? "s" : "";
        return res.status(500).json({
          error: `Server is missing required environment variable${plural}: ${result.missing.join(", ")}. Set them in Vercel → Settings → Environment Variables, then redeploy.`,
          misconfigured: true,
          missing: result.missing,
        });
      }
      // Slow down brute-force a tiny bit. Real protection would be a rate
      // limiter — fine for a single-admin app.
      await new Promise((r) => setTimeout(r, 350));
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signSession(email);
    if (!token) {
      console.error("login: SESSION_SECRET missing or too short");
      return res.status(500).json({
        error: "Server misconfigured: SESSION_SECRET missing or too short.",
        misconfigured: true,
      });
    }
    res.setHeader("Set-Cookie", buildSessionCookieHeader(token));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
}
