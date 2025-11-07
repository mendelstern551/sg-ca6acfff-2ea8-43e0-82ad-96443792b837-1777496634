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
    const maxRetries = 3;
    const baseDelay = 300;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const resp = await fetch("/api/task-types", {
          method: "GET",
          headers: { Accept: "application/json" }
        });

        if (resp.ok) {
          const ct = resp.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const json = await resp.json() as { data?: { id: string; name: string }[] };
            return Array.isArray(json?.data) ? json.data : [];
          } else {
            const text = await resp.text();
            console.warn("[task types] Non-JSON response, skipping parse. Status:", resp.status, "Snippet:", text.slice(0, 120));
          }
        } else {
          console.warn("[task types] API returned non-OK:", resp.status);
        }
      } catch (err) {
        console.warn("[task types] API request failed:", err);
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (sdkErr) {
      console.error("[task types] Supabase fallback failed:", sdkErr);
      return [];
    }
  },

  async startTask(taskData: Omit<TaskLogInsert, "started_at">): Promise<TaskLog> {
    const { data: activeTask, error: activeTaskError } = await supabase
      .from("task_logs")
      .select("id")
      .eq("employee_id", taskData.employee_id)
      .is("completed_at", null)
      .single();

    if (activeTask) {
      throw new Error("An active task is already running. Please complete it before starting a new one.");
    }
    if (activeTaskError && activeTaskError.code !== 'PGRST116') {
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
        const ct = resp.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const json = await resp.json();
          const arr = Array.isArray(json?.data) ? (json.data as Building[]) : [];
          return arr;
        } else {
          const text = await resp.text();
          console.warn("[buildings] Non-JSON response, skipping parse. Status:", resp.status, "Snippet:", text.slice(0, 120));
        }
      } else {
        console.warn("[buildings] API returned non-OK:", resp.status);
      }

      if (resp.status === 400 || resp.status === 404) {
        return [];
      }

      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getAllBuildings(retries + 1);
      }

      return [];
    } catch (apiErr) {
      console.warn("API /api/buildings fetch failed:", apiErr);
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getAllBuildings(retries + 1);
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
    name: string,
    description?: string
  ): Promise<TaskType> {
    try {
      const { data, error } = await supabase
        .from("task_types")
        .insert({
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
