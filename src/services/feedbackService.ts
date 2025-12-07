import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FeedbackSubmission = Database["public"]["Tables"]["feedback_submissions"]["Row"];
type FeedbackSubmissionInsert = Database["public"]["Tables"]["feedback_submissions"]["Insert"];

export interface FeedbackStats {
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  pendingResponses: number;
  averageRating: number;
  totalBonusIssued: number;
}

export interface BookingFeedbackStatus {
  bookingId: string;
  emailSent: boolean;
  emailSentDate: string | null;
  feedbackReceived: boolean;
  feedbackDate: string | null;
  rating: number | null;
  bonusIssued: boolean;
  daysSinceEmailSent: number | null;
}

export const feedbackService = {
  /**
   * Get feedback submission for a specific booking
   */
  async getFeedbackByBooking(bookingId: string): Promise<FeedbackSubmission | null> {
    try {
      const { data, error } = await supabase
        .from("feedback_submissions")
        .select("*")
        .eq("booking_id", bookingId)
        .order("submission_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return null;
    }
  },

  /**
   * Get all feedback submissions
   */
  async getAllFeedback(): Promise<FeedbackSubmission[]> {
    try {
      const { data, error } = await supabase
        .from("feedback_submissions")
        .select("*")
        .order("submission_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching all feedback:", error);
      return [];
    }
  },

  /**
   * Record a feedback submission (typically called from webhook or form)
   */
  async recordFeedback(feedbackData: FeedbackSubmissionInsert): Promise<FeedbackSubmission | null> {
    try {
      const { data, error } = await supabase
        .from("feedback_submissions")
        .insert(feedbackData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error recording feedback:", error);
      return null;
    }
  },

  /**
   * Mark bonus credit as issued
   */
  async issueBonusCredit(feedbackId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("feedback_submissions")
        .update({ 
          bonus_credit_issued: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", feedbackId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error issuing bonus credit:", error);
      return false;
    }
  },

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      // Get all email logs for feedback requests
      const { data: emailLogs, error: emailError } = await supabase
        .from("email_logs")
        .select("booking_id")
        .eq("email_type", "feedback_request")
        .eq("status", "sent");

      if (emailError) throw emailError;

      const totalSent = emailLogs?.length || 0;

      // Get all feedback submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("feedback_submissions")
        .select("rating, bonus_credit_issued, bonus_credit_amount");

      if (submissionsError) throw submissionsError;

      const totalResponded = submissions?.length || 0;
      const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0;
      const pendingResponses = totalSent - totalResponded;

      const ratings = submissions?.map(s => s.rating).filter(r => r !== null) as number[];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      const totalBonusIssued = submissions?.reduce((sum, s) => {
        return sum + (s.bonus_credit_issued ? Number(s.bonus_credit_amount) : 0);
      }, 0) || 0;

      return {
        totalSent,
        totalResponded,
        responseRate,
        pendingResponses,
        averageRating,
        totalBonusIssued
      };
    } catch (error) {
      console.error("Error calculating feedback stats:", error);
      return {
        totalSent: 0,
        totalResponded: 0,
        responseRate: 0,
        pendingResponses: 0,
        averageRating: 0,
        totalBonusIssued: 0
      };
    }
  },

  /**
   * Get feedback status for all bookings
   */
  async getBookingsFeedbackStatus(bookingIds: string[]): Promise<Map<string, BookingFeedbackStatus>> {
    try {
      const statusMap = new Map<string, BookingFeedbackStatus>();

      // Get email logs
      const { data: emailLogs } = await supabase
        .from("email_logs")
        .select("booking_id, sent_at")
        .eq("email_type", "feedback_request")
        .eq("status", "sent")
        .in("booking_id", bookingIds);

      // Get feedback submissions
      const { data: submissions } = await supabase
        .from("feedback_submissions")
        .select("booking_id, submission_date, rating, bonus_credit_issued")
        .in("booking_id", bookingIds);

      // Build status map
      for (const bookingId of bookingIds) {
        const emailLog = emailLogs?.find(e => e.booking_id === bookingId);
        const feedback = submissions?.find(f => f.booking_id === bookingId);

        const emailSentDate = emailLog?.sent_at || null;
        const daysSinceEmailSent = emailSentDate 
          ? Math.floor((Date.now() - new Date(emailSentDate).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        statusMap.set(bookingId, {
          bookingId,
          emailSent: !!emailLog,
          emailSentDate,
          feedbackReceived: !!feedback,
          feedbackDate: feedback?.submission_date || null,
          rating: feedback?.rating || null,
          bonusIssued: feedback?.bonus_credit_issued || false,
          daysSinceEmailSent
        });
      }

      return statusMap;
    } catch (error) {
      console.error("Error getting bookings feedback status:", error);
      return new Map();
    }
  }
};