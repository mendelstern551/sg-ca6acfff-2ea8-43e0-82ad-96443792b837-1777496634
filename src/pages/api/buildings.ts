
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !serviceKey) {
      console.error("Missing Supabase credentials");
      return res.status(500).json({ 
        error: "Server configuration error", 
        details: "Missing Supabase credentials" 
      });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      },
    });

    const { data: buildings, error: buildingsError } = await supabase
      .from("buildings")
      .select("*")
      .order("name", { ascending: true });

    if (buildingsError) {
      console.error("Buildings query error:", buildingsError);
      return res.status(500).json({ 
        error: "Database query failed", 
        details: buildingsError.message 
      });
    }

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true });

    if (roomsError) {
      console.error("Rooms query error:", roomsError);
      return res.status(500).json({ 
        error: "Database query failed", 
        details: roomsError.message 
      });
    }

    const buildingsWithRooms = (buildings || []).map(building => ({
      ...building,
      rooms: (rooms || []).filter(room => room.building_id === building.id)
    }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );
    
    return res.status(200).json({ data: buildingsWithRooms });
  } catch (error: any) {
    console.error("Unexpected error in /api/buildings:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message || String(error) 
    });
  }
}
