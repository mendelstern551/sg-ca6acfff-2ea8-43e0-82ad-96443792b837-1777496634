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

        // ✅ Simple test query
        const { data, error } = await supabase.from("buildings").select("*").limit(1);

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });
    } catch (err: any) {
        console.error("Server error:", err);
        return res.status(500).json({ error: err.message || "Unknown error" });
    }
}
