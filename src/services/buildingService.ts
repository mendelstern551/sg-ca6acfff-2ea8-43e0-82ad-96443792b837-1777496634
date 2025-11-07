import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];

export type BuildingWithRooms = Building & {
  rooms: Room[];
};

export const buildingService = {
  async getBuildingsWithRooms(): Promise<BuildingWithRooms[]> {
    const resp = await fetch("/api/buildings");

    if (!resp.ok) {
      // Improved error handling as you suggested
      const errorBody = await resp.text();
      console.error("Failed to fetch buildings via API:", resp.status, errorBody);
      throw new Error(`Failed to fetch buildings. Status: ${resp.status}. Body: ${errorBody}`);
    }
    
    const result = await resp.json();

    if (result.error) {
        console.error("API returned an error:", result.error, result.details);
        throw new Error(result.error);
    }
    
    // The API now consistently returns a 'data' property
    return result.data as BuildingWithRooms[];
  },

  async getBuilding(id: string): Promise<Building | null> {
    const { data, error } = await supabase
      .from("buildings")
      .select(`
        *,
        rooms (
          *
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching building ${id}:`, error);
      // Return null if not found, otherwise throw
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Building;
  }
};
