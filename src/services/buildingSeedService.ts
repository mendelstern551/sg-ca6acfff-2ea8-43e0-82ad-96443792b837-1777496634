import { supabase } from "@/integrations/supabase/client";

interface BuildingSeedData {
  name: string;
  map_image_url: string;
  target_heating_level: number;
  rooms: {
    name: string;
    floor: number;
    bed_count: number;
    bunk_bed_count: number;
  }[];
}

// Updated with correct room counts and bunk bed tracking (red beds = bunk beds)
const BUILDING_SEEDS: BuildingSeedData[] = [
  {
    name: "Building #1 (661)",
    map_image_url: "/661_building_1.jpg",
    target_heating_level: 20,
    rooms: [
      // Floor 1 - 6 rooms
      { name: "Room 101", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 102", floor: 1, bed_count: 0, bunk_bed_count: 2 }, // 2 bunk beds (red on map)
      { name: "Room 103", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 104", floor: 1, bed_count: 2, bunk_bed_count: 1 },
      { name: "Room 105", floor: 1, bed_count: 0, bunk_bed_count: 2 }, // 2 bunk beds (red on map)
      { name: "Room 106", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      // Floor 2 - 6 rooms (12 total)
      { name: "Room 201", floor: 2, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 202", floor: 2, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 203", floor: 2, bed_count: 0, bunk_bed_count: 2 }, // 2 bunk beds (red on map)
      { name: "Room 204", floor: 2, bed_count: 2, bunk_bed_count: 1 },
      { name: "Room 205", floor: 2, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 206", floor: 2, bed_count: 0, bunk_bed_count: 2 }  // 2 bunk beds (red on map)
    ]
  },
  {
    name: "Building #3",
    map_image_url: "/Building_3.jpg",
    target_heating_level: 20,
    rooms: [
      { name: "Room 301", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 302", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 303", floor: 1, bed_count: 0, bunk_bed_count: 2 }, // red beds = bunk
      { name: "Room 304", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 305", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 306", floor: 1, bed_count: 0, bunk_bed_count: 1 }  // 1 bunk bed (red on map)
    ]
  },
  {
    name: "Building #4",
    map_image_url: "/building_4.jpg",
    target_heating_level: 20,
    rooms: [
      { name: "Room 401", floor: 1, bed_count: 0, bunk_bed_count: 2 }, // red beds = bunk
      { name: "Room 402", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 403", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 404", floor: 1, bed_count: 0, bunk_bed_count: 3 }, // 3 bunk beds (red on map)
      { name: "Room 405", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 406", floor: 1, bed_count: 2, bunk_bed_count: 1 }
    ]
  },
  {
    name: "Building #5 Basement",
    map_image_url: "/Buildiong_5_basement.jpg",
    target_heating_level: 19,
    rooms: [
      { name: "Room B01", floor: 0, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room B02", floor: 0, bed_count: 0, bunk_bed_count: 2 }, // red beds = bunk
      { name: "Room B03", floor: 0, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room B04", floor: 0, bed_count: 1, bunk_bed_count: 0 }
    ]
  },
  {
    name: "Building #5 Upper Floor",
    map_image_url: "/Building_5_upper_floor.jpg",
    target_heating_level: 20,
    rooms: [
      { name: "Room 501", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 502", floor: 1, bed_count: 0, bunk_bed_count: 2 }, // red beds = bunk
      { name: "Room 503", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 504", floor: 1, bed_count: 2, bunk_bed_count: 1 },
      { name: "Room 505", floor: 1, bed_count: 0, bunk_bed_count: 1 }, // 1 bunk bed (red on map)
      { name: "Room 506", floor: 1, bed_count: 1, bunk_bed_count: 0 }
    ]
  }
];

export const buildingSeedService = {
  async seedAllBuildings(): Promise<{ success: boolean; message: string }> {
    try {
      for (const buildingData of BUILDING_SEEDS) {
        const { data: existingBuilding } = await supabase
          .from("buildings")
          .select("id")
          .eq("name", buildingData.name)
          .maybeSingle();

        let buildingId: string;

        if (existingBuilding) {
          buildingId = existingBuilding.id;
          await supabase
            .from("buildings")
            .update({
              map_image_url: buildingData.map_image_url,
              target_heating_level: buildingData.target_heating_level
            })
            .eq("id", buildingId);
        } else {
          const { data: newBuilding, error: buildingError } = await supabase
            .from("buildings")
            .insert([{
              name: buildingData.name,
              map_image_url: buildingData.map_image_url,
              target_heating_level: buildingData.target_heating_level
            }])
            .select()
            .single();

          if (buildingError) throw buildingError;
          buildingId = newBuilding.id;
        }

        // Delete existing rooms for this building to avoid duplicates
        await supabase
          .from("rooms")
          .delete()
          .eq("building_id", buildingId);

        // Insert all rooms fresh
        const roomsToInsert = buildingData.rooms.map(roomData => ({
          building_id: buildingId,
          name: roomData.name,
          floor: roomData.floor,
          bed_count: roomData.bed_count,
          bunk_bed_count: roomData.bunk_bed_count
        }));

        const { error: roomsError } = await supabase
          .from("rooms")
          .insert(roomsToInsert);

        if (roomsError) throw roomsError;
      }

      return {
        success: true,
        message: `Successfully seeded ${BUILDING_SEEDS.length} buildings with their rooms (Building #1 now has 12 rooms)`
      };
    } catch (error) {
      console.error("Error seeding buildings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  async clearAllBuildingsAndRooms(): Promise<{ success: boolean; message: string }> {
    try {
      await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      return {
        success: true,
        message: "Successfully cleared all buildings and rooms"
      };
    } catch (error) {
      console.error("Error clearing buildings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
};
