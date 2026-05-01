// POST /api/auth/logout — clears the session cookie. Idempotent.

import type { NextApiRequest, NextApiResponse } from "next";
import { buildClearSessionCookieHeader } from "@/lib/auth-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", buildClearSessionCookieHeader());
  return res.status(200).json({ ok: true });
}
