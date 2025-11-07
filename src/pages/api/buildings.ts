import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface ApiResponse {
    data?: unknown;
    error?: string;
    details?: string;
}

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    if (!svc) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    return createClient(url, svc, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
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
        const supabase = getSupabase(); // <-- inside try/catch

        const { data, error } = await supabase
            .from("buildings")
            .select("id,name,rooms(id,name)")
            .order("name", { ascending: true });

        if (error) {
            return res
                .status(500)
                .json({ error: "Database query failed", details: error.message });
        }

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=30, stale-while-revalidate=120"
        );
        return res.status(200).json({ data: data ?? [] });
    } catch (e: any) {
        return res
            .status(500)
            .json({ error: "Server config error", details: String(e?.message || e) });
    }
}
