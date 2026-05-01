// GET /api/auth/me — returns { email } if a valid session cookie is present,
// otherwise 401. Used by client-side guards to check session freshness.

import type { NextApiRequest, NextApiResponse } from "next";
import { readSessionFromReq } from "@/lib/auth-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = readSessionFromReq(req.cookies);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.status(200).json({ email: session.email });
}
