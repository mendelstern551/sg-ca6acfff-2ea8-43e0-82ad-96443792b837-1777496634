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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Server-side: Use the SERVICE_ROLE_KEY to bypass RLS for public data.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase server configuration is missing.");
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data, error } = await supabase
      .from("buildings")
      .select(`
        *,
        rooms ( * )
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("API error fetching buildings:", error.message, error.details, error.hint);
      return res.status(502).json({ 
        error: "Database query failed", 
        details: `${error.message}${error.hint ? ' - ' + error.hint : ''}`
      });
    }

    // Cache for 30 seconds to reduce load
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json({ data: data || [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error in buildings API:", message);
    return res.status(500).json({ error: "Internal Server Error", details: message });
  }
}
