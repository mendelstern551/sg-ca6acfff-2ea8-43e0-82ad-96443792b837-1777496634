import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EmailLog = Database["public"]["Tables"]["email_logs"]["Row"];
type EmailLogInsert = Database["public"]["Tables"]["email_logs"]["Insert"];

export interface EmailTrackingData {
  bookingId?: string;
  emailType: "invoice" | "confirmation" | "payment_reminder" | "other";
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status?: "sent" | "failed" | "pending";
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export const emailTrackingService = {
  /**
   * Log an email that was sent
   */
  async logEmail(data: EmailTrackingData): Promise<EmailLog | null> {
    try {
      const emailLog: EmailLogInsert = {
        booking_id: data.bookingId || null,
        email_type: data.emailType,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName || null,
        subject: data.subject,
        status: data.status || "sent",
        error_message: data.errorMessage || null,
        metadata: data.metadata || null,
        sent_at: new Date().toISOString(),
        sent_to: data.recipientEmail,
      };

      const { data: result, error } = await supabase
        .from("email_logs")
        .insert(emailLog)
        .select()
        .single();

      if (error) {
        console.error("Error logging email:", error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Error in logEmail:", error);
      return null;
    }
  },

  /**
   * Get all email logs with optional filters
   */
  async getAllEmailLogs(filters?: {
    bookingId?: string;
    emailType?: string;
    limit?: number;
  }): Promise<EmailLog[]> {
    try {
      let query = supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (filters?.bookingId) {
        query = query.eq("booking_id", filters.bookingId);
      }

      if (filters?.emailType) {
        query = query.eq("email_type", filters.emailType);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching email logs:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllEmailLogs:", error);
      return [];
    }
  },

  /**
   * Get email logs for a specific booking
   */
  async getEmailLogsByBooking(bookingId: string): Promise<EmailLog[]> {
    return this.getAllEmailLogs({ bookingId });
  },

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("email_type, status");

      if (error) {
        console.error("Error fetching email stats:", error);
        return { total: 0, byType: {}, byStatus: {} };
      }

      const total = data.length;
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      data.forEach((log) => {
        byType[log.email_type] = (byType[log.email_type] || 0) + 1;
        byStatus[log.status] = (byStatus[log.status] || 0) + 1;
      });

      return { total, byType, byStatus };
    } catch (error) {
      console.error("Error in getEmailStats:", error);
      return { total: 0, byType: {}, byStatus: {} };
    }
  },

  /**
   * Delete an email log
   */
  async deleteEmailLog(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("email_logs")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting email log:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteEmailLog:", error);
      return false;
    }
  }
};