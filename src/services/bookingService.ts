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
    // Get bookings first
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("start_date", { ascending: false });

    if (bookingsError) throw bookingsError;
    if (!bookingsData) return [];

    // Get payments separately
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*");

    if (paymentsError) {
      console.warn("Error fetching payments:", paymentsError);
      // Return bookings without payments if payments fetch fails
      return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
    }

    // Manually join payments to bookings
    const bookingsWithPayments = bookingsData.map(booking => ({
      ...booking,
      payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
    }));

    return bookingsWithPayments.map(normalizeBooking);
  },

  async getBookingById(id: string): Promise<Booking | null> {
    // Get booking first
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (bookingError) throw bookingError;
    if (!bookingData) return null;

    // Get payments for this booking
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", id);

    if (paymentsError) {
      console.warn("Error fetching payments:", paymentsError);
      return normalizeBooking({ ...bookingData, payments: [] });
    }

    return normalizeBooking({ 
      ...bookingData, 
      payments: paymentsData || [] 
    });
  },

  async createBooking(booking: Omit<BookingInsert, "id" | "created_at" | "updated_at">): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return normalizeBooking({ ...data, payments: [] });
  },

  async updateBooking(id: string, updates: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Get payments for the updated booking
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", id);

    return normalizeBooking({ 
      ...data, 
      payments: paymentsData || [] 
    });
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    // Get bookings in date range
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .gte("start_date", startDate)
      .lte("end_date", endDate)
      .order("start_date", { ascending: true });

    if (bookingsError) throw bookingsError;
    if (!bookingsData) return [];

    // Get all payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*");

    // Manually join payments to bookings
    const bookingsWithPayments = bookingsData.map(booking => ({
      ...booking,
      payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
    }));

    return bookingsWithPayments.map(normalizeBooking);
  },

  async getConfirmedBookings(): Promise<Booking[]> {
    // Get confirmed bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("confirmed", true)
      .order("start_date", { ascending: true });

    if (bookingsError) throw bookingsError;
    if (!bookingsData) return [];

    // Get all payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*");

    // Manually join payments to bookings
    const bookingsWithPayments = bookingsData.map(booking => ({
      ...booking,
      payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
    }));

    return bookingsWithPayments.map(normalizeBooking);
  },

  async getPendingBookings(): Promise<Booking[]> {
    // Get pending bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("confirmed", false)
      .order("start_date", { ascending: true });

    if (bookingsError) throw bookingsError;
    if (!bookingsData) return [];

    // Get all payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*");

    // Manually join payments to bookings
    const bookingsWithPayments = bookingsData.map(booking => ({
      ...booking,
      payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
    }));

    return bookingsWithPayments.map(normalizeBooking);
  }
};
