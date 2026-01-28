import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];

// Retry helper function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Don't retry on specific errors
      if (error.code === '401' || error.code === '403' || error.message?.includes('JWT')) {
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

export const invoiceService = {
  async generateInvoiceNumber(): Promise<string> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("invoices")
          .select("invoice_number")
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (result.error) throw result.error;
        return result;
      });

      if (!data || data.length === 0) {
        return "INV-2025-0001";
      }

      const lastNumber = data[0].invoice_number;
      const parts = lastNumber.split("-");
      const year = new Date().getFullYear().toString();
      const lastNum = parseInt(parts[2]) || 0;
      const newNum = (lastNum + 1).toString().padStart(4, "0");

      return `INV-${year}-${newNum}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Fallback: generate based on timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `INV-${new Date().getFullYear()}-${timestamp}`;
    }
  },

  async createInvoice(bookingId: string, bookingData: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    eventDateStart: string;
    eventDateEnd: string;
    numberOfGuests: number;
    numberOfRooms: number;
    basePrice: number;
    depositAmount: number;
    balanceDue: number;
    totalAmount: number;
    notes?: string;
  }): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoiceData: InvoiceInsert = {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      client_name: bookingData.clientName,
      client_email: bookingData.clientEmail,
      client_phone: bookingData.clientPhone,
      event_date_start: bookingData.eventDateStart,
      event_date_end: bookingData.eventDateEnd,
      number_of_guests: bookingData.numberOfGuests,
      number_of_rooms: bookingData.numberOfRooms,
      base_price: bookingData.basePrice,
      deposit_amount: bookingData.depositAmount,
      balance_due: bookingData.balanceDue,
      total_amount: bookingData.totalAmount,
      amount: bookingData.totalAmount,
      status: "unpaid",
      notes: bookingData.notes
    };

    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select();
      
      if (result.error) throw result.error;
      return result;
    });

    if (!data || data.length === 0) throw new Error("Failed to create invoice");
    return data[0];
  },

  async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("invoices")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (result.error) throw result.error;
        return result;
      });
      
      if (!data || data.length === 0) {
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error("Error fetching invoice by booking ID:", error);
      return null; // Return null on error to prevent blocking UI
    }
  },

  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (result.error) throw result.error;
        return result;
      });

      return data || [];
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      // Return empty array on error to prevent UI crash
      return [];
    }
  },

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from("invoices")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", invoiceId);

      if (error) throw error;
    });
  },

  async updateInvoiceCustomerInfo(bookingId: string, customerData: {
    clientName: string;
    clientEmail?: string | null;
    clientPhone?: string | null;
  }): Promise<void> {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from("invoices")
        .update({
          client_name: customerData.clientName,
          client_email: customerData.clientEmail || null,
          client_phone: customerData.clientPhone || null,
          updated_at: new Date().toISOString()
        })
        .eq("booking_id", bookingId);

      if (error) throw error;
    });
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;
    });
  },

  async updateEmailStatus(invoiceId: string, status: {
    emailSentAt?: string;
    emailSentTo?: string;
    emailStatus?: 'pending' | 'sent' | 'failed';
    lastReminderSentAt?: string;
    reminderCount?: number;
  }): Promise<void> {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from("invoices")
        .update({
          ...status,
          updated_at: new Date().toISOString()
        })
        .eq("id", invoiceId);

      if (error) throw error;
    });
  },

  async recordPaymentReminder(reminderData: {
    bookingId: string;
    invoiceId?: string;
    reminderType: '30_day' | '7_day' | 'payment_received' | 'custom';
    sentTo: string;
    status: 'sent' | 'failed';
    notes?: string;
  }): Promise<void> {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from("payment_reminders")
        .insert([{
          booking_id: reminderData.bookingId,
          invoice_id: reminderData.invoiceId,
          reminder_type: reminderData.reminderType,
          sent_to: reminderData.sentTo,
          status: reminderData.status,
          notes: reminderData.notes
        }]);

      if (error) throw error;
    });
  },

  async getPaymentReminders(bookingId: string): Promise<any[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from("payment_reminders")
          .select("*")
          .eq("booking_id", bookingId)
          .order("sent_at", { ascending: false });
        
        if (result.error) throw result.error;
        return result;
      });

      return data || [];
    } catch (error) {
      console.error("Error fetching payment reminders:", error);
      return [];
    }
  },

  async syncInvoiceWithPayments(bookingId: string, payments: Array<{ amount: number }>): Promise<void> {
    try {
      const validPayments = payments.filter(p => p && p.amount && p.amount > 0);
      const actualAmountPaid = validPayments.length > 0
        ? validPayments.reduce((sum, p) => sum + p.amount, 0)
        : 0;

      const invoice = await this.getInvoiceByBookingId(bookingId);
      if (!invoice) return;

      const actualBalanceDue = invoice.total_amount - actualAmountPaid;

      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from("invoices")
          .update({
            deposit_amount: actualAmountPaid,
            balance_due: actualBalanceDue,
            amount: invoice.total_amount,
            updated_at: new Date().toISOString()
          })
          .eq("booking_id", bookingId);

        if (error) throw error;
      });
    } catch (error) {
      console.error("Error syncing invoice with payments:", error);
    }
  },

  async syncAllInvoicesWithPayments(): Promise<void> {
    try {
      // Get all bookings with their payments using a join
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          payments (
            amount
          )
        `);

      if (error) throw error;
      if (!bookings) return;

      // Sync each booking's invoice with its payments
      for (const booking of bookings) {
        // Cast to any to handle the join relationship property
        const payments = (booking as any).payments || [];
        await this.syncInvoiceWithPayments(booking.id, payments);
      }
    } catch (error) {
      console.error("Error syncing all invoices:", error);
    }
  }
};
