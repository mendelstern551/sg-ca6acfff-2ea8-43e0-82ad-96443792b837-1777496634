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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email, password } = (req.body || {}) as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const ok = await verifyCredentials(email, password);
    if (!ok) {
      // Slow down brute-force a tiny bit. Real protection would be a rate
      // limiter — fine for a single-admin app.
      await new Promise((r) => setTimeout(r, 350));
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signSession(email);
    if (!token) {
      console.error("login: SESSION_SECRET missing or too short");
      return res.status(500).json({ error: "Server misconfigured" });
    }
    res.setHeader("Set-Cookie", buildSessionCookieHeader(token));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
}
