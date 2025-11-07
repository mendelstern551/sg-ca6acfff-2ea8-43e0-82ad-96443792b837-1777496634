import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { differenceInMinutes } from "date-fns";

export type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];
type TaskLogInsert = Database["public"]["Tables"]["task_logs"]["Insert"];
type Building = Database["public"]["Tables"]["buildings"]["Row"];
type TaskType = Database["public"]["Tables"]["task_types"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

export interface TaskLogWithDetails extends Omit<TaskLog, "duration_minutes"> {
  building?: Building;
  task_type?: TaskType;
  duration_minutes?: number | null;
}

export const taskLogService = {
  async getTaskTypes(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from("task_types")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching task types:", error);
      throw error;
    }
    return data || [];
  },

  async startTask(taskData: Omit<TaskLogInsert, "started_at">): Promise<TaskLog> {
    // Ensure no other task is active for this employee
    const { data: activeTask, error: activeTaskError } = await supabase
      .from("task_logs")
      .select("id")
      .eq("employee_id", taskData.employee_id)
      .is("completed_at", null)
      .single();

    if (activeTask) {
      throw new Error("An active task is already running. Please complete it before starting a new one.");
    }
    if (activeTaskError && activeTaskError.code !== 'PGRST116') { // Ignore "not found" error
        throw activeTaskError;
    }

    const { data, error } = await supabase
      .from("task_logs")
      .insert({ ...taskData, started_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error("Error starting task:", error);
      throw new Error("Failed to start the task. Please try again.");
    }
    return data;
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

  async getActiveTask(employeeId: string): Promise<(TaskLog & { task_types: { name: string; } | null; buildings: { name: string; } | null; rooms: Room | null; }) | null> {
    try {
      const { data, error } = await supabase
        .from("task_logs")
        .select(`
          *,
          task_types ( name ),
          buildings ( name ),
          rooms ( * )
        `)
        .eq("employee_id", employeeId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
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

  async getAllBuildings(retries = 0): Promise<Building[]> {
    const maxRetries = 3;
    const baseDelay = 400;
    try {
      const resp = await fetch("/api/buildings", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (resp.ok) {
        const json = await resp.json();
        const arr = Array.isArray(json?.data) ? (json.data as Building[]) : [];
        return arr;
      }

      if (resp.status === 400 || resp.status === 404) {
        console.warn("API responded with", resp.status, "for buildings list");
        return [];
      }

      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`Retrying /api/buildings after ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getAllBuildings(retries + 1);
      }

      console.error("API /api/buildings returned non-OK status and retries exhausted:", resp.status);
      return [];
    } catch (apiErr) {
      console.warn("API /api/buildings fetch failed:", apiErr);
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`Retrying /api/buildings after ${delay}ms due to network error (attempt ${retries + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getAllBuildings(retries + 1);
      }
      return [];
    }
  },

  async getTaskTypesByBuilding(buildingId: string, retries = 0): Promise<TaskType[]> {
    const maxRetries = 3;
    const baseDelay = 400;

    try {
      if (!buildingId || buildingId.trim() === "") {
        console.warn("Empty building ID provided to getTaskTypesByBuilding");
        return [];
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(buildingId)) {
        console.warn("Invalid UUID format for building ID:", buildingId);
        return [];
      }

      const url = `/api/task-types?buildingId=${encodeURIComponent(buildingId)}`;
      try {
        const resp = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (resp.ok) {
          const json = await resp.json();
          const arr = Array.isArray(json?.data) ? (json.data as TaskType[]) : [];
          return arr;
        }

        // For 400/404, don't retry; these indicate invalid/missing building or not found
        if (resp.status === 400 || resp.status === 404) {
          console.warn("API responded with", resp.status, "for buildingId:", buildingId);
          return [];
        }

        // Retry transient server-side errors (5xx or other non-OK apart from 400/404)
        if (retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries);
          console.log(`Retrying /api/task-types after ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.getTaskTypesByBuilding(buildingId, retries + 1);
        }

        console.error("API /api/task-types returned non-OK status and retries exhausted:", resp.status);
        return [];
      } catch (apiErr) {
        // Network-level error hitting the API route
        console.warn("API proxy fetch failed:", apiErr);
        if (retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries);
          console.log(`Retrying /api/task-types after ${delay}ms due to network error (attempt ${retries + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.getTaskTypesByBuilding(buildingId, retries + 1);
        }
        return [];
      }
    } catch (error) {
      console.error("Unexpected error in getTaskTypesByBuilding:", {
        error: error instanceof Error ? error.message : String(error),
        buildingId,
        timestamp: new Date().toISOString(),
      });
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
