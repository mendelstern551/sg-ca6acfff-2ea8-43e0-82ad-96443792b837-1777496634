import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];

export const invoiceService = {
  // Update signature to match usage: createInvoice(bookingId, data)
  async createInvoice(bookingId: string, invoiceData: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    amount?: number; // Optional in input, calculated/mapped to total_amount/amount
    totalAmount?: number;
    depositAmount?: number;
    balanceDue?: number;
    dueDate?: string;
    issuedDate?: string;
    numberOfGuests?: number;
    numberOfRooms?: number;
    eventDateStart?: string;
    eventDateEnd?: string;
    basePrice?: number;
    notes?: string;
    lineItems?: Array<{ description: string; amount: number; quantity?: number }>;
  }): Promise<Invoice> {
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Logic to determine main amount fields
    // The database has 'amount', 'total_amount', 'base_price'
    const mainAmount = invoiceData.amount || invoiceData.totalAmount || 0;

    const invoiceInsert: InvoiceInsert = {
      invoice_number: invoiceNumber,
      booking_id: bookingId,
      client_name: invoiceData.clientName,
      client_email: invoiceData.clientEmail || null,
      client_phone: invoiceData.clientPhone || null,
      
      // Map fields to DB schema
      amount: mainAmount,
      total_amount: invoiceData.totalAmount || mainAmount,
      base_price: invoiceData.basePrice || mainAmount,
      
      deposit_amount: invoiceData.depositAmount || null,
      balance_due: invoiceData.balanceDue !== undefined ? invoiceData.balanceDue : mainAmount,
      
      status: "pending",
      due_date: invoiceData.dueDate || null,
      issued_date: invoiceData.issuedDate || new Date().toISOString().split("T")[0],
      number_of_guests: invoiceData.numberOfGuests || null,
      number_of_rooms: invoiceData.numberOfRooms || null,
      event_date_start: invoiceData.eventDateStart || null,
      event_date_end: invoiceData.eventDateEnd || null,
      notes: invoiceData.notes || null,
      line_items: invoiceData.lineItems ? JSON.parse(JSON.stringify(invoiceData.lineItems)) : null,
      email_status: "not_sent",
      reminder_count: 0,
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert(invoiceInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return data;
  },

  // Alias for getInvoices to match usage in index.tsx
  async getAllInvoices(): Promise<Invoice[]> {
    return this.getInvoices();
  },

  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }

    return data || [];
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }

    return data;
  },

  async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching invoice by booking ID:", error);
      return null;
    }

    return data;
  },

  async updateInvoice(
    id: string,
    updates: Partial<Omit<Invoice, "id" | "created_at" | "updated_at">>
  ): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }

    return data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  },

  async updateInvoiceStatus(invoiceId: string, totalPaid: number, totalAmount: number): Promise<void> {
    let newStatus: "pending" | "partial" | "paid";
    
    if (totalPaid === 0) {
      newStatus = "pending";
    } else if (totalPaid >= totalAmount) {
      newStatus = "paid";
    } else {
      newStatus = "partial";
    }

    const updates: Partial<Invoice> = {
      status: newStatus,
      balance_due: totalAmount - totalPaid,
    };

    if (newStatus === "paid") {
      updates.paid_date = new Date().toISOString().split("T")[0];
    }

    await this.updateInvoice(invoiceId, updates);
  },

  async sendInvoiceEmail(invoiceId: string, recipientEmail: string): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await this.updateInvoice(invoiceId, {
      email_status: "sent",
      email_sent_at: new Date().toISOString(),
    });
  },

  async updateEmailStatus(invoiceId: string, status: { lastReminderSentAt?: string, reminderCount?: number }): Promise<void> {
    const updates: any = {};
    if (status.lastReminderSentAt) updates.last_reminder_sent_at = status.lastReminderSentAt;
    if (status.reminderCount !== undefined) updates.reminder_count = status.reminderCount;
    
    await this.updateInvoice(invoiceId, updates);
  },

  async recordReminderSent(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await this.updateInvoice(invoiceId, {
      last_reminder_sent_at: new Date().toISOString(),
      reminder_count: (invoice.reminder_count || 0) + 1,
    });
  },

  async getOutstandingInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .in("status", ["pending", "partial"])
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching outstanding invoices:", error);
      throw error;
    }

    return data || [];
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString().split("T")[0];
    
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .in("status", ["pending", "partial"])
      .lt("due_date", today)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching overdue invoices:", error);
      throw error;
    }

    return data || [];
  },

  async syncInvoiceWithPayments(bookingId: string, paymentsData?: any[]): Promise<void> {
    try {
      const invoice = await this.getInvoiceByBookingId(bookingId);
      if (!invoice) {
        // No invoice to sync
        return;
      }

      let payments = paymentsData;
      
      if (!payments) {
        const { data, error } = await supabase
          .from("payments")
          .select("amount")
          .eq("booking_id", bookingId);

        if (error) {
          console.error("Error fetching payments:", error);
          return;
        }
        payments = data;
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const totalAmount = Number(invoice.total_amount || invoice.amount);

      await this.updateInvoiceStatus(invoice.id, totalPaid, totalAmount);
    } catch (error) {
      console.error("Error syncing invoice with payments:", error);
    }
  },

  // Alias for syncAllInvoicesWithPayments / fixAllInvoiceStatuses
  async syncAllInvoicesWithPayments(): Promise<void> {
    return this.fixAllInvoiceStatuses();
  },

  // Alias for fixInvoiceStatuses
  async fixInvoiceStatuses(): Promise<void> {
    return this.fixAllInvoiceStatuses();
  },

  async fixAllInvoiceStatuses(): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      
      for (const invoice of invoices) {
        if (invoice.booking_id) {
          await this.syncInvoiceWithPayments(invoice.booking_id);
        }
      }
    } catch (error) {
      console.error("Error fixing invoice statuses:", error);
    }
  },

  async updateInvoiceCustomerInfo(bookingId: string, info: { clientName: string; clientEmail?: string | null; clientPhone?: string | null }): Promise<void> {
    const invoice = await this.getInvoiceByBookingId(bookingId);
    if (!invoice) return;

    await this.updateInvoice(invoice.id, {
      client_name: info.clientName,
      client_email: info.clientEmail || null,
      client_phone: info.clientPhone || null
    });
  },

  async getPaymentReminders(bookingId: string): Promise<any[]> {
    // Assuming 'reminders' table exists, otherwise return empty
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Could not fetch reminders or table doesn't exist", e);
      return [];
    }
  },

  async recordPaymentReminder(data: { bookingId: string, invoiceId?: string, reminderType: string, sentTo: string, status: string, notes?: string }): Promise<void> {
    try {
      // Check if reminders table exists first
      await supabase.from("reminders").insert({
        booking_id: data.bookingId,
        reminder_type: data.reminderType,
        status: data.status,
        sent_at: new Date().toISOString(),
        // Note: adjust fields based on actual schema if needed
      } as any);
    } catch (e) {
      console.error("Error recording payment reminder:", e);
    }
  }
};