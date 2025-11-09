
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This endpoint exists to allow manual triggering of seeding
  // Users can visit /api/trigger-seed in their browser to seed buildings
  
  if (req.method === "GET" || req.method === "POST") {
    try {
      // Import dynamically to avoid issues
      const { buildingSeedService } = await import("@/services/buildingSeedService");
      const result = await buildingSeedService.seedAllBuildings();
      
      if (result.success) {
        return res.status(200).json({
          ...result,
          instructions: "Buildings seeded successfully! Return to the Building Maps tab to view them."
        });
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in trigger-seed API:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
