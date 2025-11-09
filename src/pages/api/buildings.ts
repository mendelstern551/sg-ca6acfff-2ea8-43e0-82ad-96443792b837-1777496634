
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Content-Type", "application/json");

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            console.error("Missing Supabase credentials", { hasUrl: !!url, hasKey: !!serviceKey });
            return res.status(500).json({
                error: "Server configuration error",
                details: "Missing Supabase credentials"
            });
        }

        const supabase = createClient(url, serviceKey);

        // ✅ FIXED: Now fetching buildings WITH their associated rooms
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
            .order("name");

        if (error) {
            console.error("Supabase query error:", error);
            return res.status(500).json({ 
                error: error.message,
                details: error.details || "Failed to fetch buildings with rooms"
            });
        }

        // Transform the data to ensure rooms is always an array
        const buildingsWithRooms = (data || []).map(building => ({
            ...building,
            rooms: Array.isArray(building.rooms) ? building.rooms : []
        }));

        res.status(200).json({ data: buildingsWithRooms });
    } catch (err: any) {
        console.error("Unhandled error in /api/buildings:", err);
        return res.status(500).json({ 
            error: err.message || "Unknown error",
            details: "An unexpected error occurred while fetching buildings"
        });
    }
}
