
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { differenceInMinutes } from "date-fns";

type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];
type TaskLogInsert = Database["public"]["Tables"]["task_logs"]["Insert"];
type Building = Database["public"]["Tables"]["buildings"]["Row"];
type TaskType = Database["public"]["Tables"]["task_types"]["Row"];

export interface TaskLogWithDetails extends Omit<TaskLog, "duration_minutes"> {
  building?: Building;
  task_type?: TaskType;
  duration_minutes?: number | null;
}

export const taskLogService = {
  async startTask(
    employeeId: string,
    buildingId: string,
    taskTypeId: string,
    timeEntryId?: string
  ): Promise<TaskLog> {
    try {
      const activeTask = await this.getActiveTask(employeeId);
      if (activeTask) {
        await this.completeTask(activeTask.id);
      }

      const insertData: TaskLogInsert = {
        employee_id: employeeId,
        building_id: buildingId,
        task_type_id: taskTypeId,
        time_entry_id: timeEntryId || null,
        started_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("task_logs")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error starting task:", error);
      throw error;
    }
  },

  async completeTask(taskLogId: string, notes?: string): Promise<TaskLog> {
    try {
      const { data: taskLog, error: fetchError } = await supabase
        .from("task_logs")
        .select("*")
        .eq("id", taskLogId)
        .single();

      if (fetchError) throw fetchError;

      const completedAt = new Date();
      const durationMinutes = differenceInMinutes(
        completedAt,
        new Date(taskLog.started_at)
      );

      const { data, error } = await supabase
        .from("task_logs")
        .update({
          completed_at: completedAt.toISOString(),
          duration_minutes: durationMinutes,
          notes: notes || taskLog.notes
        })
        .eq("id", taskLogId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  },

  async getActiveTask(employeeId: string): Promise<TaskLog | null> {
    try {
      const { data, error } = await supabase
        .from("task_logs")
        .select("*")
        .eq("employee_id", employeeId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Error fetching active task:", error);
      return null;
    }
  },

  async getTodayTasks(employeeId: string): Promise<TaskLogWithDetails[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("task_logs")
        .select(`
          *,
          building:buildings(*),
          task_type:task_types(*)
        `)
        .eq("employee_id", employeeId)
        .gte("started_at", today.toISOString())
        .order("started_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        duration_minutes: task.completed_at
          ? differenceInMinutes(new Date(task.completed_at), new Date(task.started_at))
          : differenceInMinutes(new Date(), new Date(task.started_at))
      }));
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
      return [];
    }
  },

  async getAllBuildings(): Promise<Building[]> {
    try {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching buildings:", error);
      return [];
    }
  },

  async getTaskTypesByBuilding(buildingId: string, retries = 0): Promise<TaskType[]> {
    const maxRetries = 2;
    const baseDelay = 500;

    try {
      // CRITICAL: Validate buildingId format (UUID) and non-empty
      if (!buildingId || buildingId.trim() === "") {
        console.warn("Empty building ID provided to getTaskTypesByBuilding");
        return [];
      }

      // Basic UUID format validation to catch obviously invalid IDs early
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(buildingId)) {
        console.warn("Invalid UUID format for building ID:", buildingId);
        return [];
      }

      // Verify building exists in database first
      const { data: buildingExists, error: checkError } = await supabase
        .from("buildings")
        .select("id")
        .eq("id", buildingId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking if building exists:", checkError);
        return [];
      }

      if (!buildingExists) {
        console.warn("Building ID does not exist in database:", buildingId);
        return [];
      }

      // Now fetch task types
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("building_id", buildingId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase error fetching task types:", error.message, "Building ID:", buildingId);
        
        // Retry with exponential backoff for network errors
        // Avoid retrying on auth/permission errors (typically 401/403)
        const isAuthError = error.message?.includes("401") || error.message?.includes("403") || error.message?.includes("Unauthorized") || error.message?.includes("Forbidden");
        
        if (retries < maxRetries && !isAuthError) {
          const delay = baseDelay * Math.pow(2, retries);
          console.log(`Retrying after ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.getTaskTypesByBuilding(buildingId, retries + 1);
        }
        
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Unexpected error in getTaskTypesByBuilding:", error);
      
      // Retry for non-validation errors
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`Retrying after ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getTaskTypesByBuilding(buildingId, retries + 1);
      }
      
      return [];
    }
  },

  async createBuilding(name: string, address?: string, description?: string): Promise<Building> {
    try {
      const { data, error } = await supabase
        .from("buildings")
        .insert({ name, address, description })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating building:", error);
      throw error;
    }
  },

  async createTaskType(
    buildingId: string,
    name: string,
    description?: string
  ): Promise<TaskType> {
    try {
      const { data, error } = await supabase
        .from("task_types")
        .insert({
          building_id: buildingId,
          name,
          description
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating task type:", error);
      throw error;
    }
  }
};
