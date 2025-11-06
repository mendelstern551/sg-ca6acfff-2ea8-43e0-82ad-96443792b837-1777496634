
import type { Booking } from "@/types/booking";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const emailService = {
  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(
    invoice: Invoice,
    booking: Booking
  ): Promise<EmailResponse> {
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: invoice.client_email,
          clientName: invoice.client_name,
          invoiceNumber: invoice.invoice_number,
          eventDateStart: invoice.event_date_start,
          eventDateEnd: invoice.event_date_end,
          numberOfGuests: invoice.number_of_guests,
          totalAmount: invoice.total_amount,
          balanceDue: invoice.balance_due,
          depositAmount: invoice.deposit_amount,
          notes: invoice.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      return {
        success: true,
        message: "Invoice sent successfully!",
      };
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      return {
        success: false,
        message: "Failed to send invoice",
        error: error.message,
      };
    }
  },

  /**
   * Send booking confirmation email to client
   */
  async sendBookingConfirmation(
    booking: Booking
  ): Promise<EmailResponse> {
    try {
      if (!booking.contact_email) {
        return {
          success: false,
          message: "No email address provided",
          error: "Client email is required",
        };
      }

      const response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: booking.contact_email,
          clientName: booking.contact_name,
          bookingName: booking.name,
          bookingType: booking.booking_type,
          startDate: booking.start_date,
          endDate: booking.end_date,
          numberOfGuests: booking.number_of_guests,
          totalCost: booking.total_cost,
          depositAmount: booking.deposit_amount,
          balanceDue: booking.balance_due,
          notes: booking.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      return {
        success: true,
        message: "Confirmation sent successfully!",
      };
    } catch (error: any) {
      console.error("Error sending confirmation email:", error);
      return {
        success: false,
        message: "Failed to send confirmation",
        error: error.message,
      };
    }
  },
};
