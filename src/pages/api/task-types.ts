
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface ApiResponse {
  data?: unknown;
  error?: string;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const buildingId = String(req.query.buildingId || "").trim();
    if (!buildingId || !uuidRegex.test(buildingId)) {
      return res.status(400).json({ error: "Invalid or missing buildingId" });
    }

    // Optional: basic existence check to mirror client behavior
    const { data: buildingExists, error: checkError } = await supabase
      .from("buildings")
      .select("id")
      .eq("id", buildingId)
      .maybeSingle();

    if (checkError) {
      return res.status(502).json({ error: `Building check failed: ${checkError.message}` });
    }
    if (!buildingExists) {
      return res.status(404).json({ error: "Building not found" });
    }

    const { data, error } = await supabase
      .from("task_types")
      .select("*")
      .eq("building_id", buildingId)
      .order("name", { ascending: true });

    if (error) {
      return res.status(502).json({ error: `Supabase error: ${error.message}` });
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );
    return res.status(200).json({ data: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: `Unexpected error: ${message}` });
  }
}
  