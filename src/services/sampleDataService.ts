import { taskLogService } from "./taskLogService";

export const sampleDataService = {
  async createSampleData() {
    try {
      const mainLodge = await taskLogService.createBuilding(
        "Main Lodge",
        "123 Lake Road",
        "Primary guest facility with dining and common areas"
      );

      const cabin1 = await taskLogService.createBuilding(
        "Cabin 1",
        "125 Lake Road",
        "Guest cabin near the lake"
      );

      const cabin2 = await taskLogService.createBuilding(
        "Cabin 2",
        "127 Lake Road",
        "Guest cabin with mountain view"
      );

      const taskTypes = [
        { name: "Linen Change", description: "Replace all bed linens and towels" },
        { name: "Bathroom Cleaning", description: "Deep clean bathroom facilities" },
        { name: "Garbage Collection", description: "Empty all trash and recycling bins" },
        { name: "General Cleaning", description: "Vacuum, dust, and clean common areas" },
        { name: "Table Setup", description: "Set up dining tables for meals" }
      ];

      await Promise.all(
        taskTypes.map(task =>
          taskLogService.createTaskType(task.name, task.description)
        )
      );

      return { success: true, message: "Sample data created successfully" };
    } catch (error) {
      console.error("Error creating sample data:", error);
      throw error;
    }
  },

  async hasSampleData(): Promise<boolean> {
    try {
      const buildings = await taskLogService.getAllBuildings();
      return buildings.length > 0;
    } catch (error) {
      console.error("Error checking sample data:", error);
      return false;
    }
  }
};
