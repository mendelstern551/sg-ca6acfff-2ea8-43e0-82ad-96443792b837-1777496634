import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface ApiResponse {
  data?: unknown;
  error?: string;
  details?: string;
}

// Use the public anon key, as RLS policies will grant access.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
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
      .select(`
        *,
        rooms ( * )
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("API error fetching buildings:", error.message);
      // Return JSON error response
      return res.status(500).json({ 
        error: "Database query failed", 
        details: error.message 
      });
    }

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    // Return data in a consistent { data: [...] } format
    return res.status(200).json({ data: data || [] });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error in buildings API:", message);
    return res.status(500).json({ error: "Internal Server Error", details: message });
  }
}
