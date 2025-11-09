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

        const { data, error } = await supabase.from("buildings").select("*");

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ data });
    } catch (err: any) {
        console.error("Unhandled error:", err);
        return res.status(500).json({ error: err.message || "Unknown error" });
    }
}
