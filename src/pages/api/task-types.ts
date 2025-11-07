import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseServerClient = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabaseServerClient.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Not authorized" });
  }

  try {
    // This route now fetches ALL task types, as they are global.
    const { data, error } = await supabaseServerClient
      .from("task_types")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("API error fetching task types:", error.message);
      return res.status(500).json({ error: "Database query failed", details: error.message });
    }

    return res.status(200).json({ data: data || [] });
  } catch (error: any) {
    console.error("Unexpected error in /api/task-types:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}