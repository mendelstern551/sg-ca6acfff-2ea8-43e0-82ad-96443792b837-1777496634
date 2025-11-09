import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface ApiResponse {
    data?: unknown;
    error?: string;
    details?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    res.setHeader("Content-Type", "application/json");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            console.error("Missing Supabase credentials", { hasUrl: !!url, hasKey: !!serviceKey });
            return res.status(500).json({
                error: "Server configuration error",
                details: "Missing Supabase credentials",
            });
        }

        const supabase = createClient(url, serviceKey);

        const { data, error } = await supabase
            .from("buildings")
            .select(`
        *,
        rooms (
          id,
          name,
          building_id,
          floor,
          bed_count,
          bunk_bed_count,
          map_image_url,
          created_at
        )
      `)
            .order("name")
            .order("name", { foreignTable: "rooms" });

        if (error) {
            console.error("Supabase query error:", error);
            return res.status(500).json({
                error: error.message,
                details: error.details || "Failed to fetch buildings with rooms",
            });
        }

        const buildingsWithRooms = (data || []).map((building) => ({
            ...building,
            rooms: Array.isArray(building.rooms) ? building.rooms : [],
        }));

        res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        return res.status(200).json({ data: buildingsWithRooms });
    } catch (err: any) {
        console.error("Unhandled error in /api/buildings:", err);
        return res.status(500).json({
            error: err.message || "Unknown error",
            details: "An unexpected error occurred while fetching buildings",
        });
    }
}
