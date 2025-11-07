
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"] & {
    rooms: Room[];
};
export type Room = Database["public"]["Tables"]["rooms"]["Row"];

export const buildingService = {
  async getBuildingsWithRooms(): Promise<Building[]> {
    const { data, error } = await supabase
      .from("buildings")
      .select(`
        *,
        rooms (
          *
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching buildings with rooms:", error);
      throw error;
    }

    return data as Building[];
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
      // Don't throw if it's just a "not found" error
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Building;
  }
};
