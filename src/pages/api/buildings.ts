import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface ApiResponse {
  data?: unknown;
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ✅ Ensure env variables are read correctly
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error("❌ Missing Supabase credentials", { url, serviceKey });
      return res.status(500).json({
        error: "Server configuration error",
        details: "Missing Supabase credentials",
      });
    }

    // ✅ Create static Supabase client
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ✅ Fetch data
    const { data, error } = await supabase
      .from("buildings")
      .select("id, name, rooms(id, name)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Database query failed:", error);
      return res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
    }

    return res.status(200).json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error in buildings API:", message);
    return res.status(500).json({
      error: "Internal Server Error",
      details: message,
    });
  }
}
