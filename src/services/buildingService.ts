import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];

export type BuildingWithRooms = Building & {
  rooms: Room[];
};

export const buildingService = {
  async getBuildingsWithRooms(): Promise<BuildingWithRooms[]> {
    try {
      const resp = await fetch("/api/buildings");

      if (!resp.ok) {
        // Try to parse as JSON first
        const contentType = resp.headers.get("content-type");
        let errorMessage = `API request failed with status ${resp.status}`;
        
        if (contentType?.includes("application/json")) {
          try {
            const errorData = await resp.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            console.error("API JSON error:", errorData);
          } catch (jsonError) {
            console.error("Failed to parse error JSON:", jsonError);
          }
        } else {
          // It's HTML or other non-JSON content
          const htmlError = await resp.text();
          console.error("API returned HTML error:", htmlError.substring(0, 500));
          errorMessage = "Server returned an HTML error page. Check server logs.";
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await resp.json();

      if (result.error) {
        console.error("API returned an error:", result.error, result.details);
        throw new Error(`${result.error}${result.details ? `: ${result.details}` : ''}`);
      }
      
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error("buildingService.getBuildingsWithRooms error:", error);
      throw error;
    }
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
