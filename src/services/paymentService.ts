import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

export interface Payment extends PaymentRow {}

export const paymentService = {
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPayment(payment: Omit<PaymentInsert, "id" | "created_at" | "updated_at">): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .insert([payment])
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  },

  async updatePayment(id: string, updates: PaymentUpdate): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  },

  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  }
};