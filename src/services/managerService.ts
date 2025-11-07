import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { timeTrackingService } from "./timeTrackingService";
import { differenceInMinutes } from "date-fns";

type ManagerCompensationRow = Database["public"]["Tables"]["manager_compensation"]["Row"];
type ManagerCompensationInsert = Database["public"]["Tables"]["manager_compensation"]["Insert"];
type ManagerCompensationUpdate = Database["public"]["Tables"]["manager_compensation"]["Update"];

type ManagerPaymentRow = Database["public"]["Tables"]["manager_payments"]["Row"];
type ManagerPaymentInsert = Database["public"]["Tables"]["manager_payments"]["Insert"];

export interface ManagerCompensation extends ManagerCompensationRow {
  manager_payments?: ManagerPayment[];
}

export type ManagerPayment = ManagerPaymentRow;

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

interface EmployeeWithStats {
  id: string;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  pay_rate: number | null;
  total_hours: number;
  total_earnings: number;
}

export const managerService = {
  async getAllCompensation(): Promise<ManagerCompensation[]> {
    const { data, error } = await supabase
      .from("manager_compensation")
      .select(`
        *,
        manager_payments (*)
      `)
      .order("due_date", { ascending: false });

    if (error) throw error;
    return (data as ManagerCompensation[]) || [];
  },

  async getCompensationByBooking(bookingId: string): Promise<ManagerCompensation[]> {
    const { data, error } = await supabase
      .from("manager_compensation")
      .select(`
        *,
        manager_payments (*)
      `)
      .eq("booking_id", bookingId)
      .order("due_date", { ascending: false });

    if (error) throw error;
    return (data as ManagerCompensation[]) || [];
  },

  async createCompensation(compensation: Omit<ManagerCompensationInsert, "id" | "created_at" | "updated_at">): Promise<ManagerCompensation> {
    const { data, error } = await supabase
      .from("manager_compensation")
      .insert([compensation])
      .select()
      .single();

    if (error) throw error;
    return data as ManagerCompensation;
  },

  async updateCompensation(id: string, updates: ManagerCompensationUpdate): Promise<ManagerCompensation> {
    const { data, error } = await supabase
      .from("manager_compensation")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as ManagerCompensation;
  },

  async deleteCompensation(id: string): Promise<void> {
    const { error } = await supabase
      .from("manager_compensation")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async createPayment(payment: Omit<ManagerPaymentInsert, "id" | "created_at" | "updated_at">): Promise<ManagerPayment> {
    const { data, error } = await supabase
      .from("manager_payments")
      .insert([payment])
      .select()
      .single();

    if (error) throw error;
    return data as ManagerPayment;
  },

  async getUnpaidCompensation(): Promise<ManagerCompensation[]> {
    const { data, error } = await supabase
      .from("manager_compensation")
      .select(`
        *,
        manager_payments (*)
      `)
      .eq("paid", false)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data as ManagerCompensation[]) || [];
  },

  async getEmployeeHoursAndPay(
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeWithStats[]> {
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, full_name, email, job_title, pay_rate");

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      return [];
    }

    try {
      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from("time_entries")
        .select("*")
        .in("employee_id", employees.map((e) => e.id));

      if (timeEntriesError) {
        console.error("Error fetching time entries:", timeEntriesError);
        return [];
      }

      const employeeStats = employees.map((employee) => {
        const employeeTimeEntries = (timeEntries || []).filter(
          (entry) => entry.employee_id === employee.id && entry.clock_out
        ).map(e => ({ ...e, duration_minutes: differenceInMinutes(new Date(e.clock_out!), new Date(e.clock_in)) }));
        
        const { totalHours } = timeTrackingService.calculateTotalHours(employeeTimeEntries);
        const payRate = employee.pay_rate || 0;
        const totalEarnings = totalHours * payRate;

        return {
          id: employee.id,
          full_name: employee.full_name,
          email: employee.email,
          job_title: employee.job_title,
          pay_rate: employee.pay_rate,
          total_hours: totalHours,
          total_earnings: totalEarnings,
        };
      });

      return employeeStats;
    } catch (error) {
      console.error("Error calculating employee hours and pay:", error);
      return [];
    }
  },

  async getManagerSalaryData(
    employeeId: string,
    year: number
  ): Promise<{ month: string; total_salary: number }[]> {
    const { data, error } = await supabase.rpc("get_monthly_manager_salary", {
      p_employee_id: employeeId,
      p_year: year,
    });

    if (error) {
      console.error("Error fetching manager salary data:", error);
      return [];
    }
    return data;
  },
};