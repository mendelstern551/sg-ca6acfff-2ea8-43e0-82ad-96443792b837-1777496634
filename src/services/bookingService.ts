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

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Don't retry on auth errors or schema errors
      if (error.code === '401' || error.code === '403' || 
          error.message?.includes('JWT') || 
          error.message?.includes('schema cache')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export const bookingService = {
  async getAllBookings(): Promise<Booking[]> {
    try {
      // Get bookings first with retry logic - select only booking columns
      const { data: bookingsData, error: bookingsError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("bookings")
          .select("*")
          .order("start_date", { ascending: false });
        
        if (result.error) throw result.error;
        return result;
      });

      if (bookingsError) throw bookingsError;
      if (!bookingsData) return [];

      // Get payments separately with retry logic
      try {
        const { data: paymentsData, error: paymentsError } = await retryWithBackoff(async () => {
          const result = await supabase
            .from("payments")
            .select("*");
          
          if (result.error) throw result.error;
          return result;
        });

        if (paymentsError) {
          console.warn("Error fetching payments:", paymentsError);
          return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
        }

        // Manually join payments to bookings
        const bookingsWithPayments = bookingsData.map(booking => ({
          ...booking,
          payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
        }));

        return bookingsWithPayments.map(normalizeBooking);
      } catch (paymentsError) {
        console.error("Failed to fetch payments after retries:", paymentsError);
        return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      // Get booking first with retry logic - select only booking columns
      const { data: bookingData, error: bookingError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("bookings")
          .select("*")
          .eq("id", id)
          .single();
        
        if (result.error) throw result.error;
        return result;
      });

      if (bookingError) throw bookingError;
      if (!bookingData) return null;

      // Get payments for this booking with retry logic
      try {
        const { data: paymentsData, error: paymentsError } = await retryWithBackoff(async () => {
          const result = await supabase
            .from("payments")
            .select("*")
            .eq("booking_id", id);
          
          if (result.error) throw result.error;
          return result;
        });

        if (paymentsError) {
          console.warn("Error fetching payments:", paymentsError);
          return normalizeBooking({ ...bookingData, payments: [] });
        }

        return normalizeBooking({ 
          ...bookingData, 
          payments: paymentsData || [] 
        });
      } catch (paymentsError) {
        console.error("Failed to fetch payments after retries:", paymentsError);
        return normalizeBooking({ ...bookingData, payments: [] });
      }
    } catch (error) {
      console.error("Error fetching booking by ID:", error);
      throw error;
    }
  },

  async createBooking(booking: Omit<BookingInsert, "id" | "created_at" | "updated_at">): Promise<Booking> {
    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from("bookings")
        .insert([booking])
        .select("*")
        .single();
      
      if (result.error) throw result.error;
      return result;
    });

    if (error) throw error;
    return normalizeBooking({ ...data, payments: [] });
  },

  async updateBooking(id: string, updates: BookingUpdate): Promise<Booking> {
    // CRITICAL FIX: Only select booking table columns, never include payments in the select
    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from("bookings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      
      if (result.error) throw result.error;
      return result;
    });

    if (error) throw error;

    // Get payments for the updated booking with retry logic (separate query)
    try {
      const { data: paymentsData } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("payments")
          .select("*")
          .eq("booking_id", id);
        
        if (result.error) throw result.error;
        return result;
      });

      return normalizeBooking({ 
        ...data, 
        payments: paymentsData || [] 
      });
    } catch (paymentsError) {
      console.error("Failed to fetch payments after retries:", paymentsError);
      return normalizeBooking({ ...data, payments: [] });
    }
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);
      
      if (result.error) throw result.error;
      return result;
    });

    if (error) throw error;
  },

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    try {
      // Get bookings in date range with retry logic - select only booking columns
      const { data: bookingsData, error: bookingsError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("bookings")
          .select("*")
          .gte("start_date", startDate)
          .lte("end_date", endDate)
          .order("start_date", { ascending: true });
        
        if (result.error) throw result.error;
        return result;
      });

      if (bookingsError) throw bookingsError;
      if (!bookingsData) return [];

      // Get all payments with retry logic
      try {
        const { data: paymentsData } = await retryWithBackoff(async () => {
          const result = await supabase
            .from("payments")
            .select("*");
          
          if (result.error) throw result.error;
          return result;
        });

        // Manually join payments to bookings
        const bookingsWithPayments = bookingsData.map(booking => ({
          ...booking,
          payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
        }));

        return bookingsWithPayments.map(normalizeBooking);
      } catch (paymentsError) {
        console.error("Failed to fetch payments after retries:", paymentsError);
        return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
      }
    } catch (error) {
      console.error("Error fetching bookings by date range:", error);
      throw error;
    }
  },

  async getConfirmedBookings(): Promise<Booking[]> {
    try {
      // Get confirmed bookings with retry logic - select only booking columns
      const { data: bookingsData, error: bookingsError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("bookings")
          .select("*")
          .eq("confirmed", true)
          .order("start_date", { ascending: true });
        
        if (result.error) throw result.error;
        return result;
      });

      if (bookingsError) throw bookingsError;
      if (!bookingsData) return [];

      // Get all payments with retry logic
      try {
        const { data: paymentsData } = await retryWithBackoff(async () => {
          const result = await supabase
            .from("payments")
            .select("*");
          
          if (result.error) throw result.error;
          return result;
        });

        // Manually join payments to bookings
        const bookingsWithPayments = bookingsData.map(booking => ({
          ...booking,
          payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
        }));

        return bookingsWithPayments.map(normalizeBooking);
      } catch (paymentsError) {
        console.error("Failed to fetch payments after retries:", paymentsError);
        return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
      }
    } catch (error) {
      console.error("Error fetching confirmed bookings:", error);
      throw error;
    }
  },

  async getPendingBookings(): Promise<Booking[]> {
    try {
      // Get pending bookings with retry logic - select only booking columns
      const { data: bookingsData, error: bookingsError } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("bookings")
          .select("*")
          .eq("confirmed", false)
          .order("start_date", { ascending: true });
        
        if (result.error) throw result.error;
        return result;
      });

      if (bookingsError) throw bookingsError;
      if (!bookingsData) return [];

      // Get all payments with retry logic
      try {
        const { data: paymentsData } = await retryWithBackoff(async () => {
          const result = await supabase
            .from("payments")
            .select("*");
          
          if (result.error) throw result.error;
          return result;
        });

        // Manually join payments to bookings
        const bookingsWithPayments = bookingsData.map(booking => ({
          ...booking,
          payments: (paymentsData || []).filter(payment => payment.booking_id === booking.id)
        }));

        return bookingsWithPayments.map(normalizeBooking);
      } catch (paymentsError) {
        console.error("Failed to fetch payments after retries:", paymentsError);
        return bookingsData.map(booking => normalizeBooking({ ...booking, payments: [] }));
      }
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      throw error;
    }
  }
};
