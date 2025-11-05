import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Booking } from "@/types/booking";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

// Helper to ensure payments array is always present
const normalizeBooking = (booking: any): Booking => {
  if (!booking) return booking;
  return {
    ...booking,
    payments: Array.isArray(booking.payments) ? booking.payments : [],
  };
};

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
    return (data || []).map(normalizeBooking);
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
    return data ? normalizeBooking(data) : null;
  },

  async createBooking(booking: Omit<BookingInsert, "id" | "created_at" | "updated_at">): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return normalizeBooking(data);
  },

  async updateBooking(id: string, updates: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        payments (*)
      `)
      .single();

    if (error) throw error;
    return normalizeBooking(data);
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
    return (data || []).map(normalizeBooking);
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
    return (data || []).map(normalizeBooking);
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
    return (data || []).map(normalizeBooking);
  }
};
