
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return res.status(500).json({ error: "Missing Supabase credentials" });
        }

        const supabase = createClient(url, key);

        // Fetch all buildings with their rooms
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
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message, details: error });
        }

        // Transform the data to ensure rooms is always an array
        const buildingsWithRooms = (buildings || []).map(building => ({
            ...building,
            rooms: Array.isArray(building.rooms) ? building.rooms : []
        }));

        return res.status(200).json({ success: true, data: buildingsWithRooms });
    } catch (err: any) {
        console.error("Server error:", err);
        return res.status(500).json({ error: err.message || "Unknown error" });
    }
}
