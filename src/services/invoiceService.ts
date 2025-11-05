
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];

export const invoiceService = {
  async generateInvoiceNumber(): Promise<string> {
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return "INV-2025-0001";
    }

    const lastNumber = data[0].invoice_number;
    const parts = lastNumber.split("-");
    const year = new Date().getFullYear().toString();
    const lastNum = parseInt(parts[2]) || 0;
    const newNum = (lastNum + 1).toString().padStart(4, "0");

    return `INV-${year}-${newNum}`;
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
      status: "unpaid",
      notes: bookingData.notes
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert([invoiceData])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create invoice");
    return data[0];
  },

  async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return data[0];
  },

  async getAllInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", invoiceId);

    if (error) throw error;
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) throw error;
  }
};
