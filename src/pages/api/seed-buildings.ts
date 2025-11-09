
import type { NextApiRequest, NextApiResponse } from "next";
import { buildingSeedService } from "@/services/buildingSeedService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const result = await buildingSeedService.seedAllBuildings();
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in seed-buildings API:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await buildingSeedService.clearAllBuildingsAndRooms();
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in clear buildings API:", error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
