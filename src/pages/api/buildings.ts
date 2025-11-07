import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface ApiResponse {
  data?: unknown;
  error?: string;
  details?: string;
}

function assertEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!svc) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error("SUPABASE URL looks wrong");
  }
  if (!svc.startsWith("eyJhbGci")) {
    throw new Error("Service role key looks malformed");
  }
}
assertEnv();

// create the server-side Supabase client ONCE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("buildings")
      .select("id,name,rooms(id,name)")
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    return res.status(200).json({ data: data ?? [] });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: String(e?.message || e) });
  }
}
