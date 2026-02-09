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
  }) {
    try {
      console.log("🔧 Creating invoice via RPC bypass...");
      
      const clientName = bookingData.clientName || bookingData.client_name || "Unknown Client";
      const totalAmount = bookingData.total_cost;
      const depositAmount = bookingData.deposit_paid || 0;
      const balanceDue = totalAmount - depositAmount;
      const invoiceNumber = `INV-${Date.now()}`;
      const dueDate = new Date(bookingData.check_in);
      dueDate.setDate(dueDate.getDate() - 7); // Due 7 days before check-in

      // Call the RPC function we just created
      const { data, error } = await supabase.rpc('create_invoice_bypass', {
        p_booking_id: bookingId,
        p_invoice_number: invoiceNumber,
        p_client_name: clientName,
        p_total_amount: totalAmount,
        p_deposit_amount: depositAmount,
        p_balance_due: balanceDue,
        p_status: balanceDue > 0 ? 'pending' : 'paid',
        p_due_date: dueDate.toISOString()
      });

      if (error) {
        console.error("❌ RPC insert failed:", error);
        throw error;
      }

      console.log("✅ Invoice created successfully via RPC!", data);
      return data as unknown as Invoice; // Return the created invoice object cast correctly

    } catch (error: any) {
      console.error("❌ Invoice creation failed:", error);
      throw new Error(`Failed to create invoice: ${error.message}`);
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

      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId);

      const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const balanceDue = (invoice.total_amount || 0) - totalPaid;
      const newStatus = balanceDue <= 0 ? "paid" : "pending";

      await this.updateInvoiceAmounts(invoiceId, {
        deposit_amount: totalPaid,
        balance_due: balanceDue
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
            return []; 
        }
        return data || [];
    } catch {
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