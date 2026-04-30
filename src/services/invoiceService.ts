import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Invoice = Database['public']['Tables']['invoices']['Row'];

export interface InvoiceWithDetails extends Invoice {
  payment_reminders?: any[];
  // Extended properties used by the app
  event_date_start?: string;
  event_date_end?: string;
  number_of_guests?: number;
  number_of_rooms?: number;
  base_price?: number;
  reminder_count?: number;
  last_reminder_sent_at?: string;
}

export const invoiceService = {
  // Aliases for compatibility
  async getAllInvoices() {
    return this.getInvoices();
  },

  async getInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }

    return data as InvoiceWithDetails[] || [];
  },

  async createInvoice(bookingId: string, bookingData: {
    clientName?: string;
    client_name?: string;
    clientEmail?: string;
    clientPhone?: string;
    check_in: string;
    check_out: string;
    total_cost: number;
    deposit_paid: number;
    number_of_guests?: number;
    number_of_rooms?: number;
    base_price?: number;
    notes?: string;
  }) {
    try {
      const clientName = bookingData.clientName || bookingData.client_name || "Unknown Client";

      // Calculate balance due
      const balanceDue = bookingData.total_cost - bookingData.deposit_paid;

      // Call Next.js API route to create invoice
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          totalAmount: bookingData.total_cost,
          depositAmount: bookingData.deposit_paid,
          balanceDue,
          eventDateStart: bookingData.check_in,
          eventDateEnd: bookingData.check_out,
          numberOfGuests: bookingData.number_of_guests ?? 0,
          numberOfRooms: bookingData.number_of_rooms ?? 0,
          basePrice: bookingData.base_price,
          notes: bookingData.notes,
          clientName,
          clientEmail: bookingData.clientEmail,
          clientPhone: bookingData.clientPhone,
          status: balanceDue <= 0 ? "paid" : "pending"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }

      const result = await response.json();
      return result.invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  },

  async getInvoiceByBookingId(bookingId: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }

    return data as InvoiceWithDetails | null;
  },

  async getInvoiceById(invoiceId: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }

    return data as InvoiceWithDetails;
  },

  async updateInvoiceStatus(invoiceId: string, status: string) {
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId);

    if (error) {
      console.error("Error updating invoice status:", error);
      throw error;
    }
  },

  async updateInvoiceAmounts(invoiceId: string, amounts: {
    total_amount?: number;
    deposit_amount?: number;
    balance_due?: number;
  }) {
    const { error } = await supabase
      .from("invoices")
      .update(amounts)
      .eq("id", invoiceId);

    if (error) {
      console.error("Error updating invoice amounts:", error);
      throw error;
    }
  },

  async updateInvoiceCustomerInfo(invoiceId: string, info: { 
    clientName?: string; 
    client_name?: string; 
    clientEmail?: string; 
    client_email?: string;
    clientPhone?: string; 
    client_phone?: string;
  }) {
    
    // Map camelCase to snake_case
    const updateData: any = { ...info };
    
    if (info.clientName) {
        updateData.client_name = info.clientName;
        delete updateData.clientName;
    }
    
    if (info.clientEmail) {
        updateData.client_email = info.clientEmail;
        delete updateData.clientEmail;
    }

    if (info.clientPhone) {
        updateData.client_phone = info.clientPhone;
        delete updateData.clientPhone;
    }

    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    if (error) {
      console.error("Error updating invoice customer info:", error);
      throw error;
    }
  },

  async syncInvoiceWithPayments(invoiceId: string) {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) return;

      // Aggregate payments tied to either invoice OR booking. The dashboard's
      // PaymentDialog only writes `booking_id` on payment rows, so a strict
      // `eq("invoice_id", ...)` would miss every dashboard-recorded payment
      // and leave balance_due / status stuck at the original values.
      const invByInvoice = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId);
      const invoicePayments = (invByInvoice.data || []) as Array<{ amount: number | null }>;
      let bookingPayments: Array<{ amount: number | null }> = [];
      if (invoice.booking_id) {
        const invByBooking = await supabase
          .from("payments")
          .select("amount")
          .eq("booking_id", invoice.booking_id);
        bookingPayments = (invByBooking.data || []) as Array<{ amount: number | null }>;
      }
      // Dedupe — a payment with both invoice_id AND booking_id set would
      // otherwise be counted twice. Pull from invoice_id first; fall back to
      // booking_id only when invoice_id returned nothing (the normal dashboard
      // case where PaymentDialog skips invoice_id).
      const ledger = invoicePayments.length > 0 ? invoicePayments : bookingPayments;
      const totalPaidRaw = ledger.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalPaid = Math.round(totalPaidRaw * 100) / 100;
      const totalAmount = Math.round((Number(invoice.total_amount) || 0) * 100) / 100;
      const balanceRaw = totalAmount - totalPaid;
      const balanceDue = Math.abs(balanceRaw) < 0.01 ? 0 : Math.round(balanceRaw * 100) / 100;
      const newStatus = balanceDue <= 0 ? "paid" : "pending";

      await this.updateInvoiceAmounts(invoiceId, {
        deposit_amount: totalPaid,
        balance_due: balanceDue < 0 ? 0 : balanceDue,
      });

      await this.updateInvoiceStatus(invoiceId, newStatus);
    } catch (error) {
      console.error("Error syncing invoice with payments:", error);
    }
  },

  async syncAllInvoicesWithPayments() {
    try {
      const invoices = await this.getInvoices();
      for (const invoice of invoices) {
        await this.syncInvoiceWithPayments(invoice.id);
      }
      return { success: true, count: invoices.length };
    } catch (error) {
      console.error("Error syncing all invoices:", error);
      throw error;
    }
  },

  async fixInvoiceStatuses() {
    return this.syncAllInvoicesWithPayments();
  },

  // Email status tracking
  async updateEmailStatus(invoiceId: string, status: string) {
    const { error } = await supabase
      .from("invoices")
      .update({ 
        email_status: status,
        email_sent_at: new Date().toISOString()
      })
      .eq("id", invoiceId);

    if (error) {
      console.error("Error updating email status:", error);
      // Don't throw here to avoid blocking UI flow for analytics
    }
  },

  // Payment Reminders
  async getPaymentReminders(invoiceId: string) {
    try {
        const { data, error } = await supabase
        .from("payment_reminders" as any) 
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: false });
        
        if (error) {
            console.warn("getPaymentReminders failed (table missing or RLS):", error.message);
            return [];
        }
        return data || [];
    } catch (e) {
        console.warn("getPaymentReminders threw:", e);
        return [];
    }
  },

  async recordPaymentReminder(invoiceId: string, method: string) {
    try {
        await supabase
        .from("payment_reminders" as any)
        .insert({
            invoice_id: invoiceId,
            reminder_type: method,
            sent_at: new Date().toISOString()
        });
    } catch (e) {
        console.warn("Could not record payment reminder (table might not exist)", e);
    }
  }
};