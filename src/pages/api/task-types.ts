import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // This is a public endpoint, so we don't need to check for a session.
  // The RLS policy on the 'task_types' table allows public read access.
  const supabaseServerClient = createServerSupabaseClient({ req, res });

  try {
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