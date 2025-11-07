import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface ApiResponse {
  data?: unknown;
  error?: string;
}

// Add a timeout guard to prevent hanging requests
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { data, error } = await supabase
      .from("buildings")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return res.status(502).json({ error: `Supabase error: ${error.message}` });
    }

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json({ data: (data as unknown) ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("timed out")) {
      return res.status(504).json({ error: "Upstream timeout when fetching buildings" });
    }
    return res.status(500).json({ error: `Unexpected error: ${message}` });
  }
}
