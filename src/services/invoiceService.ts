import { supabase } from "@/integrations/supabase/client";

// Define the shape that the UI expects (flattened invoice + booking details)
export interface InvoiceWithDetails {
  id: string;
  booking_id: string | null;
  invoice_number: string;
  amount: number;
  total_amount: number | null;
  deposit_amount: number | null;
  balance_due: number | null;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  notes: string | null;
  email_status: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Flattened booking details mapped for UI
  event_date_start?: string;
  event_date_end?: string;
  number_of_guests?: number;
  number_of_rooms?: number;
  base_price?: number;
  reminder_count?: number;
  last_reminder_sent_at?: string;
}

export const invoiceService = {
  // Helper to map DB response to UI expected format
  _mapToInvoiceWithDetails(invoice: any): InvoiceWithDetails {
    // Handle case where booking might be null or missing
    const booking = invoice.bookings;
    
    return {
      ...invoice,
      // Map nested booking details to top-level properties
      event_date_start: booking?.start_date,
      event_date_end: booking?.end_date,
      number_of_guests: booking?.number_of_guests,
      number_of_rooms: booking?.number_of_rooms,
      // Use invoice amount or fallback to booking cost
      base_price: invoice.amount || booking?.total_cost || 0,
      // Default missing optional fields
      reminder_count: 0,
      last_reminder_sent_at: invoice.email_sent_at
    };
  },

  async getAllInvoices(): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        bookings (
          start_date,
          end_date,
          number_of_guests,
          number_of_rooms,
          total_cost
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }

    return (data || []).map(this._mapToInvoiceWithDetails);
  },

  async getInvoiceById(id: string): Promise<InvoiceWithDetails> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        bookings (
          start_date,
          end_date,
          number_of_guests,
          number_of_rooms,
          total_cost
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return this._mapToInvoiceWithDetails(data);
  },

  // Alias for getInvoiceById needed by some components
  async getInvoiceByBookingId(bookingId: string): Promise<InvoiceWithDetails | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        bookings (
          start_date,
          end_date,
          number_of_guests,
          number_of_rooms,
          total_cost
        )
      `)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching invoice by booking ID:", error);
      return null;
    }
    
    return data ? this._mapToInvoiceWithDetails(data) : null;
  },

  async createInvoice(bookingId: string, invoiceData: any) {
    console.log("Creating invoice for booking:", bookingId);

    // 1. Get the booking details first
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error("Error fetching booking for invoice:", bookingError);
      throw bookingError;
    }

    // 2. Prepare payload
    const totalCost = booking?.total_cost || invoiceData.amount || 0;
    const deposit = invoiceData.deposit_amount || 0;

    console.log("Using RPC to create invoice (bypassing REST API cache)");

    // 3. Use RPC call instead of direct insert to bypass schema cache
    const { data, error } = await supabase.rpc('create_invoice_safe', {
      p_booking_id: bookingId,
      p_invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
      p_amount: totalCost,
      p_total_amount: totalCost,
      p_deposit_amount: deposit,
      p_balance_due: totalCost - deposit,
      p_status: invoiceData.status || 'pending',
      p_due_date: invoiceData.due_date || null,
      p_client_name: booking?.contact_name || invoiceData.client_name || null,
      p_client_email: booking?.contact_email || invoiceData.client_email || null,
      p_client_phone: booking?.contact_phone || invoiceData.client_phone || null,
      p_notes: invoiceData.notes || null
    });

    if (error) {
      console.error("RPC create_invoice_safe error:", error);
      throw error;
    }

    // RPC returns an array, get the first item
    return Array.isArray(data) ? data[0] : data;
  },

  async updateInvoice(id: string, updates: any) {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInvoiceCustomerInfo(bookingId: string, customerInfo: any) {
    const { data, error } = await supabase
      .from("invoices")
      .update({
        client_name: customerInfo.client_name,
        client_email: customerInfo.client_email,
        client_phone: customerInfo.client_phone
      })
      .eq("booking_id", bookingId);

    if (error) throw error;
    return data;
  },

  async getPaymentReminders(invoiceId: string) {
    // Correctly query the generic reminders table using related_id/type
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("related_id", invoiceId)
      .eq("related_type", "invoice")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async recordPaymentReminder(invoiceId: string, type: 'email' | 'sms') {
    try {
      // 1. Update invoice status
      await this.updateInvoice(invoiceId, {
        email_status: 'sent',
        email_sent_at: new Date().toISOString()
      });

      // 2. Add entry to reminders table using correct schema
      const { error } = await supabase
        .from("reminders")
        .insert({
          title: `Payment Reminder (${type})`,
          description: `Automated payment reminder sent via ${type}`,
          related_type: 'invoice',
          related_id: invoiceId,
          status: 'completed',
          category: 'payment',
          auto_generated: true,
          // due_date is required by schema, setting to now
          due_date: new Date().toISOString() 
        });
        
      if (error) console.warn("Could not record reminder log:", error);
    } catch (e) {
      console.error("Error recording payment reminder:", e);
    }
  },

  async updateEmailStatus(id: string, status: string) {
    return this.updateInvoice(id, { 
      email_status: status,
      email_sent_at: status === 'sent' ? new Date().toISOString() : null
    });
  },

  // Singular version called by some components
  async syncInvoiceWithPayments(invoiceId: string, payments?: any[]) {
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('id', invoiceId)
        .single();
        
      if (!invoice) return;

      // If payments array is provided, use it; otherwise fetch from database
      let paymentsData = payments;
      if (!paymentsData) {
        const { data } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', invoiceId);
        paymentsData = data || [];
      }
          
      const totalPaid = paymentsData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const total = Number(invoice.total_amount || 0);
      const balance = total - totalPaid;
      const status = balance <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'pending');
      
      await this.updateInvoice(invoiceId, {
        balance_due: balance,
        status: status
      });
    } catch (error) {
      console.error("Error syncing invoice:", error);
    }
  },

  async syncAllInvoicesWithPayments() {
    try {
      const { data: invoices } = await supabase.from('invoices').select('id');
      if (!invoices) return;
      
      for (const invoice of invoices) {
        await this.syncInvoiceWithPayments(invoice.id);
      }
    } catch (error) {
      console.error("Error syncing all invoices:", error);
    }
  },

  async fixInvoiceStatuses() {
    return this.syncAllInvoicesWithPayments();
  }
};