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

// Building #1 split into Left and Right sides with bed counts matching the floor plan
// Upper floors (Floor 2): 4 beds per room
// Lower floors (Floor 1): 2 beds per room
const BUILDING_SEEDS: BuildingSeedData[] = [
  {
    name: "Building #1 - Left Side",
    map_image_url: "/661_building_1.jpg",
    target_heating_level: 20,
    rooms: [
      // Upper Floor Left - 3 rooms, 4 beds each (as marked on floor plan)
      { name: "Room L201", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      { name: "Room L202", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      { name: "Room L203", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      // Lower Floor Left - 3 rooms, 2 beds each (as marked on floor plan)
      { name: "Room L101", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room L102", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room L103", floor: 1, bed_count: 2, bunk_bed_count: 0 },
    ]
  },
  {
    name: "Building #1 - Right Side",
    map_image_url: "/661_building_1.jpg",
    target_heating_level: 20,
    rooms: [
      // Upper Floor Right - 3 rooms, 4 beds each (as marked on floor plan)
      { name: "Room R201", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      { name: "Room R202", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      { name: "Room R203", floor: 2, bed_count: 4, bunk_bed_count: 0 },
      // Lower Floor Right - 3 rooms, 2 beds each (as marked on floor plan)
      { name: "Room R101", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room R102", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room R103", floor: 1, bed_count: 2, bunk_bed_count: 0 },
    ]
  },
  {
    name: "Building #3",
    map_image_url: "/Building_3.jpg",
    target_heating_level: 20,
    rooms: [
      { name: "Room 301", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 302", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 303", floor: 1, bed_count: 0, bunk_bed_count: 2 },
      { name: "Room 304", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 305", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 306", floor: 1, bed_count: 0, bunk_bed_count: 1 }
    ]
  },
  {
    name: "Building #4",
    map_image_url: "/building_4.jpg",
    target_heating_level: 20,
    rooms: [
      { name: "Room 401", floor: 1, bed_count: 0, bunk_bed_count: 2 },
      { name: "Room 402", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 403", floor: 1, bed_count: 2, bunk_bed_count: 0 },
      { name: "Room 404", floor: 1, bed_count: 0, bunk_bed_count: 3 },
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
      { name: "Room B02", floor: 0, bed_count: 0, bunk_bed_count: 2 },
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
      { name: "Room 502", floor: 1, bed_count: 0, bunk_bed_count: 2 },
      { name: "Room 503", floor: 1, bed_count: 1, bunk_bed_count: 1 },
      { name: "Room 504", floor: 1, bed_count: 2, bunk_bed_count: 1 },
      { name: "Room 505", floor: 1, bed_count: 0, bunk_bed_count: 1 },
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

        await supabase
          .from("rooms")
          .delete()
          .eq("building_id", buildingId);

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
        message: `Successfully seeded ${BUILDING_SEEDS.length} buildings with correct bed counts (Building #1: 36 beds total - Floor 2: 24 beds, Floor 1: 12 beds)`
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
