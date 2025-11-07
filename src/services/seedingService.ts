
import { supabase } from "@/integrations/supabase/client";
import { buildingService } from "./buildingService";

// NOTE: All images are in /public directory
const buildingsData = [
  {
    name: "Building #1",
    map_image_url: "/661_building_1.jpg",
    rooms: Array.from({ length: 24 }, (_, i) => ({
      name: `Room 1${String(i + 1).padStart(2, '0')}`,
      bed_count: i < 12 ? 2 : 1, // 12 rooms with 2 beds, 12 with 1 bed = 36 total
      bunk_bed_count: 0,
    })),
  },
  {
    name: "Building #3",
    map_image_url: "/Building_3.jpg",
    rooms: Array.from({ length: 12 }, (_, i) => ({
      name: `Room 3${String(i + 1).padStart(2, '0')}`,
      bed_count: 2,
      bunk_bed_count: 0,
    })),
  },
  {
    name: "Building #4",
    map_image_url: "/building_4.jpg",
    rooms: Array.from({ length: 6 }, (_, i) => ({
      name: `Room 4${String(i + 1).padStart(2, '0')}`,
      bed_count: 3, // 1 bunk (2) + 1 single (1)
      bunk_bed_count: 1,
    })),
  },
  {
    name: "Building #5",
    map_image_url: null, // This building has floors with separate maps
    rooms: [
      // Basement
      { name: "Basement - Room 1", floor: "Basement", bed_count: 5, bunk_bed_count: 0, map_image_url: "/Buildiong_5_basement.jpg" },
      { name: "Basement - Room 2", floor: "Basement", bed_count: 4, bunk_bed_count: 2, map_image_url: "/Buildiong_5_basement.jpg" },
      // Upper Floor
      { name: "Upper - Room 1", floor: "Upper", bed_count: 2, bunk_bed_count: 0, map_image_url: "/Building_5_upper_floor.jpg" },
      { name: "Upper - Room 2", floor: "Upper", bed_count: 3, bunk_bed_count: 1, map_image_url: "/Building_5_upper_floor.jpg" },
      { name: "Upper - Room 3", floor: "Upper", bed_count: 1, bunk_bed_count: 0, map_image_url: "/Building_5_upper_floor.jpg" },
      { name: "Upper - Room 4", floor: "Upper", bed_count: 1, bunk_bed_count: 0, map_image_url: "/Building_5_upper_floor.jpg" },
    ],
  },
];

const defaultTasks = [
    { name: "Remove linen & towels" },
    { name: "Clean floor" },
    { name: "Check heating level" },
    { name: "Take out garbage" },
    { name: "Put new linen" },
    { name: "Clean toilet" },
    { name: "Check for leaks (toilet, sink)" },
    { name: "Check all lights" },
];


export const seedingService = {
  async seedInitialData() {
    console.log("Starting to seed initial data...");

    // Clear existing data to prevent duplicates
    console.log("Deleting old data...");
    await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("task_types").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Old data deleted.");

    // Seed buildings and rooms
    for (const buildingData of buildingsData) {
      const { data: building, error: buildingError } = await supabase
        .from("buildings")
        .insert({ name: buildingData.name, map_image_url: buildingData.map_image_url })
        .select()
        .single();

      if (buildingError) {
        console.error(`Error creating building ${buildingData.name}:`, buildingError);
        continue;
      }
      console.log(`Created building: ${building.name}`);

      const roomsToInsert = buildingData.rooms.map(room => ({
        ...room,
        building_id: building.id,
      }));

      const { error: roomsError } = await supabase.from("rooms").insert(roomsToInsert);
      if (roomsError) {
        console.error(`Error creating rooms for ${building.name}:`, roomsError);
      } else {
        console.log(`Created ${roomsToInsert.length} rooms for ${building.name}.`);
      }
    }

    // Seed default task types
    const { error: tasksError } = await supabase.from("task_types").insert(defaultTasks);
    if (tasksError) {
        console.error("Error creating default task types:", tasksError);
    } else {
        console.log(`Created ${defaultTasks.length} default task types.`);
    }

    console.log("Seeding complete.");
    return { success: true, message: "Database seeded successfully." };
  },
};
