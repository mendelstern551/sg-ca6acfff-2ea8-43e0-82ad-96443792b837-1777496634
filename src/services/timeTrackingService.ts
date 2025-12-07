
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { startOfDay, endOfDay, differenceInMinutes } from "date-fns";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
type TimeEntryUpdate = Database["public"]["Tables"]["time_entries"]["Update"];

export interface TimeEntryWithDuration extends TimeEntry {
  duration_minutes?: number;
}

export const timeTrackingService = {
  async clockIn(employeeId: string, location?: { lat: number; lng: number }): Promise<TimeEntry> {
    try {
      const activeEntry = await this.getActiveTimeEntry(employeeId);
      if (activeEntry) {
        throw new Error("Employee is already clocked in");
      }

      const insertData: TimeEntryInsert = {
        employee_id: employeeId,
        clock_in: new Date().toISOString(),
        entry_type: "work",
        location_lat: location?.lat || null,
        location_lon: location?.lng || null
      };

      const { data, error } = await supabase
        .from("time_entries")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error clocking in:", error);
      throw error;
    }
  },

  async clockOut(employeeId: string): Promise<TimeEntry> {
    try {
      const activeEntry = await this.getActiveTimeEntry(employeeId);
      if (!activeEntry) {
        throw new Error("No active clock-in found for this employee");
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", activeEntry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error clocking out:", error);
      throw error;
    }
  },

  async startBreak(employeeId: string): Promise<TimeEntry> {
    try {
      const insertData: TimeEntryInsert = {
        employee_id: employeeId,
        clock_in: new Date().toISOString(),
        entry_type: "break"
      };

      const { data, error } = await supabase
        .from("time_entries")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error starting break:", error);
      throw error;
    }
  },

  async endBreak(employeeId: string): Promise<TimeEntry> {
    try {
      const { data: breakEntries, error: fetchError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("entry_type", "break")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!breakEntries || breakEntries.length === 0) {
        throw new Error("No active break found");
      }

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", breakEntries[0].id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error ending break:", error);
      throw error;
    }
  },

  async getActiveTimeEntry(employeeId: string): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("entry_type", "work")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Error fetching active time entry:", error);
      return null;
    }
  },

  async getActiveBreak(employeeId: string): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("entry_type", "break")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Error fetching active break:", error);
      return null;
    }
  },

  async getTodayEntries(employeeId: string): Promise<TimeEntryWithDuration[]> {
    try {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("clock_in", start.toISOString())
        .lte("clock_in", end.toISOString())
        .order("clock_in", { ascending: true });

      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        duration_minutes: entry.clock_out
          ? differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in))
          : differenceInMinutes(new Date(), new Date(entry.clock_in))
      }));
    } catch (error) {
      console.error("Error fetching today's entries:", error);
      return [];
    }
  },

  async getDateRangeEntries(employeeId: string, startDate: Date, endDate: Date): Promise<TimeEntryWithDuration[]> {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("clock_in", startDate.toISOString())
        .lte("clock_in", endDate.toISOString())
        .order("clock_in", { ascending: true });

      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        duration_minutes: entry.clock_out
          ? differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in))
          : 0
      }));
    } catch (error) {
      console.error("Error fetching date range entries:", error);
      return [];
    }
  },

  calculateTotalHours(entries: TimeEntryWithDuration[]): {
    workHours: number;
    breakHours: number;
    totalHours: number;
  } {
    const workMinutes = entries
      .filter(e => e.entry_type === "work")
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    const breakMinutes = entries
      .filter(e => e.entry_type === "break")
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    return {
      workHours: workMinutes / 60,
      breakHours: breakMinutes / 60,
      totalHours: workMinutes / 60
    };
  }
};
