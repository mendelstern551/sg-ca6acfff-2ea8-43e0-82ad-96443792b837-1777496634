// POST /api/auth/reset-password
// Body: { token: string, password: string }
// Verifies the one-shot token from forgot-password, hashes & stores the new
// password, and clears the token. On success, also signs the user in by
// setting a fresh session cookie so they don't have to type the new
// password again.

import type { NextApiRequest, NextApiResponse } from "next";
import {
  consumeResetToken,
  updatePassword,
  signSession,
  buildSessionCookieHeader,
  getAdminEmail,
} from "@/lib/auth-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { token, password } = (req.body || {}) as {
    token?: string;
    password?: string;
  };
  if (!token || !password) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const ok = await consumeResetToken(token);
    if (!ok) {
      return res
        .status(400)
        .json({ error: "Reset link is invalid or has expired" });
    }
    await updatePassword(password);

    // Auto-login: spare the user a second form fill.
    const email = getAdminEmail() || "";
    const session = email ? signSession(email) : null;
    if (session) {
      res.setHeader("Set-Cookie", buildSessionCookieHeader(session));
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Reset failed" });
  }
}
