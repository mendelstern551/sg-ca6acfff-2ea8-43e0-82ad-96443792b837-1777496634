import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"] & {
    rooms: Room[];
};
export type Room = Database["public"]["Tables"]["rooms"]["Row"];

export const buildingService = {
  async getBuildingsWithRooms(): Promise<Building[]> {
    const resp = await fetch("/api/buildings");

    if (!resp.ok) {
      const errorBody = await resp.text();
      console.error("Failed to fetch buildings via API:", resp.status, errorBody);
      throw new Error(`Failed to fetch buildings. Status: ${resp.status}`);
    }
    
    const result = await resp.json();

    if (result.error || !Array.isArray(result.data)) {
        console.error("API returned an error or invalid data structure:", result);
        throw new Error(result.error || "Invalid data from server");
    }

    return result.data as Building[];
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
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Building;
  }
};
