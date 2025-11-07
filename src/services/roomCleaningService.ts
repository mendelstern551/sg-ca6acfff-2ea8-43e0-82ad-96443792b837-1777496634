import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type RoomCleaningSession = Database["public"]["Tables"]["room_cleaning_sessions"]["Row"];
type RoomCleaningSessionInsert = Database["public"]["Tables"]["room_cleaning_sessions"]["Insert"];
type TaskCompletion = Database["public"]["Tables"]["task_completions"]["Row"];
type TaskCompletionInsert = Database["public"]["Tables"]["task_completions"]["Insert"];
type RoomTask = Database["public"]["Tables"]["room_tasks"]["Row"];

export interface RoomWithBuilding {
  id: string;
  name: string;
  building_id: string;
  bed_count: number;
  bunk_bed_count: number;
  floor: number | null;
  building_name?: string;
  target_heating_level?: number;
}

export interface CleaningSessionWithDetails extends RoomCleaningSession {
  clock_in_time: string;
  room?: {
    name: string;
    building?: {
      name: string;
    };
  };
  employee?: {
    name: string;
  };
  completions?: TaskCompletion[];
}

export interface TaskWithCompletion extends RoomTask {
  completed?: boolean;
  completion_id?: string;
  notes?: string;
  issue_reported?: boolean;
}

export const roomCleaningService = {
  async getRoomsWithBuildings(): Promise<RoomWithBuilding[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        id,
        name,
        building_id,
        bed_count,
        bunk_bed_count,
        floor,
        buildings!inner (
          name,
          target_heating_level
        )
      `)
      .order("name");

    if (error) throw error;

    return (data || []).map((room) => ({
      id: room.id,
      name: room.name,
      building_id: room.building_id,
      bed_count: room.bed_count || 0,
      bunk_bed_count: room.bunk_bed_count || 0,
      floor: room.floor,
      building_name: Array.isArray(room.buildings) 
        ? room.buildings[0]?.name 
        : (room.buildings as any)?.name,
      target_heating_level: Array.isArray(room.buildings)
        ? room.buildings[0]?.target_heating_level
        : (room.buildings as any)?.target_heating_level
    }));
  },

  async startCleaningSession(employeeId: string, roomId: string): Promise<RoomCleaningSession> {
    const sessionData: RoomCleaningSessionInsert = {
      employee_id: employeeId,
      room_id: roomId,
      clock_in_time: new Date().toISOString(),
      status: "in_progress"
    };

    const { data, error } = await supabase
      .from("room_cleaning_sessions")
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveSession(employeeId: string): Promise<CleaningSessionWithDetails | null> {
    const { data, error } = await supabase
      .from("room_cleaning_sessions")
      .select(`
        *,
        rooms (
          name,
          buildings (
            name,
            target_heating_level
          )
        ),
        employees (
          name
        ),
        task_completions (*)
      `)
      .eq("employee_id", employeeId)
      .eq("status", "in_progress")
      .order("clock_in_time", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  },

  async getRoomTasks(): Promise<RoomTask[]> {
    const { data, error } = await supabase
      .from("room_tasks")
      .select("*")
      .eq("is_required", true)
      .order("task_order");

    if (error) throw error;
    return data || [];
  },

  async getTasksWithCompletions(sessionId: string): Promise<TaskWithCompletion[]> {
    const [tasksResult, completionsResult] = await Promise.all([
      supabase.from("room_tasks").select("*").eq("is_required", true).order("task_order"),
      supabase.from("task_completions").select("*").eq("session_id", sessionId)
    ]);

    if (tasksResult.error) throw tasksResult.error;
    if (completionsResult.error) throw completionsResult.error;

    const tasks = tasksResult.data || [];
    const completions = completionsResult.data || [];

    return tasks.map((task) => {
      const completion = completions.find((c) => c.task_id === task.id);
      return {
        ...task,
        completed: !!completion,
        completion_id: completion?.id,
        notes: completion?.notes || undefined,
        issue_reported: completion?.issue_reported || false
      };
    });
  },

  async completeTask(
    sessionId: string,
    taskId: string,
    notes?: string,
    issueReported?: boolean
  ): Promise<TaskCompletion> {
    const completionData: TaskCompletionInsert = {
      session_id: sessionId,
      task_id: taskId,
      completed_at: new Date().toISOString(),
      notes: notes || null,
      issue_reported: issueReported || false
    };

    const { data, error } = await supabase
      .from("task_completions")
      .insert([completionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uncompleteTask(completionId: string): Promise<void> {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .eq("id", completionId);

    if (error) throw error;
  },

  async endCleaningSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("room_cleaning_sessions")
      .update({
        clock_out_time: new Date().toISOString(),
        status: "completed"
      })
      .eq("id", sessionId);

    if (error) throw error;
  },

  async getAllSessions(limit = 50): Promise<CleaningSessionWithDetails[]> {
    const { data, error } = await supabase
      .from("room_cleaning_sessions")
      .select(`
        *,
        rooms (
          name,
          buildings (
            name
          )
        ),
        employees (
          name
        )
      `)
      .order("clock_in_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getSessionById(sessionId: string): Promise<CleaningSessionWithDetails | null> {
    const { data, error } = await supabase
      .from("room_cleaning_sessions")
      .select(`
        *,
        rooms (
          name,
          buildings (
            name,
            target_heating_level
          )
        ),
        employees (
          name
        ),
        task_completions (*)
      `)
      .eq("id", sessionId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }
};
