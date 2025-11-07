
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { seedingService } from "@/services/seedingService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseServerClient = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabaseServerClient.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Check if user is admin
  const { data: profile } = await supabaseServerClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }

  try {
    const result = await seedingService.seedInitialData();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Seeding error:", error);
    return res.status(500).json({ error: "Failed to seed database", details: error.message });
  }
}
