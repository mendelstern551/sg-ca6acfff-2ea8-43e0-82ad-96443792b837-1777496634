import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export interface Booking extends BookingRow {
  payments?: Payment[];
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const bookingService = {
  async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments (*)
      `)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments (*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Booking;
  },

  async createBooking(booking: Omit<BookingInsert, "id" | "created_at" | "updated_at">): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  },

  async updateBooking(id: string, updates: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments (*)
      `)
      .gte("start_date", startDate)
      .lte("end_date", endDate)
      .order("start_date", { ascending: true });

    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getConfirmedBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments (*)
      `)
      .eq("confirmed", true)
      .order("start_date", { ascending: true });

    if (error) throw error;
    return (data as Booking[]) || [];
  },

  async getPendingBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments (*)
      `)
      .eq("confirmed", false)
      .order("start_date", { ascending: true });

    if (error) throw error;
    return (data as Booking[]) || [];
  }
};