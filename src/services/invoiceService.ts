import { supabase } from "@/integrations/supabase/client";

// Define the shape that the UI expects (flattened invoice + booking details)
export interface InvoiceWithDetails {
  id: string;
  booking_id: string;
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
  async getAllInvoices(): Promise<InvoiceWithDetails[]> {
    // Select specific columns from bookings to avoid errors
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

    // Flatten and map the data to match UI expectations
    return (data || []).map((invoice: any) => ({
      ...invoice,
      event_date_start: invoice.bookings?.start_date,
      event_date_end: invoice.bookings?.end_date,
      number_of_guests: invoice.bookings?.number_of_guests,
      number_of_rooms: invoice.bookings?.number_of_rooms,
      base_price: invoice.bookings?.total_cost || invoice.amount,
    }));
  },

  async getInvoiceById(id: string) {
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
    
    // Return mapped data
    return {
      ...data,
      event_date_start: data.bookings?.start_date,
      event_date_end: data.bookings?.end_date,
      number_of_guests: data.bookings?.number_of_guests,
      number_of_rooms: data.bookings?.number_of_rooms,
      base_price: data.bookings?.total_cost || data.amount,
    };
  },

  async createInvoice(bookingId: string, invoiceData: any) {
    console.log("Creating invoice for booking:", bookingId);

    // 1. Get the booking details first using CORRECT column names
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error("Error fetching booking for invoice:", bookingError);
      throw bookingError;
    }

    // 2. Prepare the invoice payload matching the EXACT database schema
    // Mapping bookings columns (contact_name) to invoices columns (client_name)
    const totalCost = booking?.total_cost || invoiceData.amount || 0;
    const deposit = invoiceData.deposit_amount || 0;

    const invoicePayload = {
      booking_id: bookingId,
      invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
      // Use booking cost if available
      amount: totalCost,
      total_amount: totalCost,
      deposit_amount: deposit,
      balance_due: totalCost - deposit,
      status: invoiceData.status || 'pending',
      due_date: invoiceData.due_date,
      // Map booking contact info to invoice client info
      client_name: booking?.contact_name || invoiceData.client_name,
      client_email: booking?.contact_email || invoiceData.client_email,
      client_phone: booking?.contact_phone || invoiceData.client_phone,
      notes: invoiceData.notes,
      email_status: 'not_sent'
    };

    console.log("Inserting invoice payload:", invoicePayload);

    const { data, error } = await supabase
      .from("invoices")
      .insert(invoicePayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return data;
  },

  async updateInvoice(id: string, updates: any) {
    // Filter updates to only include valid columns
    const allowedColumns = [
      'amount', 'total_amount', 'deposit_amount', 'balance_due', 
      'status', 'due_date', 'paid_date', 'payment_method', 
      'client_name', 'client_email', 'client_phone', 'notes',
      'email_status', 'email_sent_at'
    ];
    
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedColumns.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const { data, error } = await supabase
      .from("invoices")
      .update(filteredUpdates)
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
    // Check if reminders table exists first
    const { error: checkError } = await supabase.from('reminders').select('id').limit(1);
    if (checkError) return []; // Return empty if table issue

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async recordPaymentReminder(invoiceId: string, type: 'email' | 'sms') {
    try {
      // Update invoice email status
      await this.updateInvoice(invoiceId, {
        email_status: 'sent',
        email_sent_at: new Date().toISOString()
      });

      // Insert into reminders table if it exists
      const { error } = await supabase
        .from("reminders")
        .insert({
          invoice_id: invoiceId,
          reminder_type: type,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        
      if (error) console.warn("Could not record reminder history:", error);
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

  async syncAllInvoicesWithPayments() {
    try {
      const { data: invoices } = await supabase.from('invoices').select('id, total_amount');
      if (!invoices) return;

      for (const invoice of invoices) {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', invoice.id);
          
        if (payments) {
          const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const total = Number(invoice.total_amount || 0);
          const balance = total - totalPaid;
          const status = balance <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'pending');
          
          await this.updateInvoice(invoice.id, {
            balance_due: balance,
            status: status
          });
        }
      }
    } catch (error) {
      console.error("Error syncing invoices:", error);
    }
  },

  async fixInvoiceStatuses() {
    return this.syncAllInvoicesWithPayments();
  }
};