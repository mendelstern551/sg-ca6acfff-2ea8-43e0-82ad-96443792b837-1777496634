import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Building = Database["public"]["Tables"]["buildings"]["Row"] & {
    rooms: Room[];
};
export type Room = Database["public"]["Tables"]["rooms"]["Row"];

export const buildingService = {
  async getBuildingsWithRooms(): Promise<Building[]> {
    try {
      const resp = await fetch("/api/buildings", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (resp.ok) {
        const ct = resp.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const json = await resp.json() as { data?: unknown };
          const arr = Array.isArray((json as any)?.data) ? (json as any).data as Building[] : [];
          return arr;
        } else {
          const text = await resp.text();
          console.warn("[buildings] Non-JSON response, skipping parse. Status:", resp.status, "Snippet:", text.slice(0, 120));
        }
      } else {
        console.warn("API /api/buildings returned non-OK:", resp.status);
      }
    } catch (apiErr) {
      console.warn("API /api/buildings request failed, falling back to Supabase client:", apiErr);
    }

    // Fallback: direct Supabase query
    const { data, error } = await supabase
      .from("buildings")
      .select(`
        *,
        rooms ( * )
      `)
      .order("name", { ascending: true });

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
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Building;
  }
};
