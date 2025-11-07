import type { Database } from "@/integrations/supabase/types";
import { differenceInMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
