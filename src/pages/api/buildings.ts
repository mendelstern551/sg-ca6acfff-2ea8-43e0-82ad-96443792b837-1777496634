
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log("[/api/buildings] Starting request...");

        // Fetch all buildings with their rooms using client-side supabase
        const { data: buildings, error } = await supabase
            .from("buildings")
            .select(`
                *,
                rooms (
                    *
                )
            `)
            .order("name");

        if (error) {
            console.error("[/api/buildings] Supabase error:", error);
            return res.status(500).json({ 
                success: false,
                error: error.message, 
                details: error.details || "No additional details",
                hint: error.hint || "Check database connection"
            });
        }

        console.log(`[/api/buildings] Found ${buildings?.length || 0} buildings`);

        // Transform the data to ensure rooms is always an array
        const buildingsWithRooms = (buildings || []).map(building => ({
            ...building,
            rooms: Array.isArray(building.rooms) ? building.rooms : []
        }));

        return res.status(200).json({ 
            success: true, 
            data: buildingsWithRooms 
        });
    } catch (err: any) {
        console.error("[/api/buildings] Unexpected error:", err);
        return res.status(500).json({ 
            success: false,
            error: "Internal server error",
            message: err.message || "Unknown error",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }
}
