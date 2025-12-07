import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ManagerCompensationRow = Database["public"]["Tables"]["manager_compensation"]["Row"];
type ManagerCompensationInsert = Database["public"]["Tables"]["manager_compensation"]["Insert"];
type ManagerCompensationUpdate = Database["public"]["Tables"]["manager_compensation"]["Update"];

type ManagerPaymentRow = Database["public"]["Tables"]["manager_payments"]["Row"];
type ManagerPaymentInsert = Database["public"]["Tables"]["manager_payments"]["Insert"];

export interface ManagerCompensation extends ManagerCompensationRow {
  manager_payments?: ManagerPayment[];
}

export type ManagerPayment = ManagerPaymentRow;

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
    return (data as unknown as ManagerCompensation[]) || [];
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
    return (data as unknown as ManagerCompensation[]) || [];
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
    return (data as unknown as ManagerCompensation[]) || [];
  }
};