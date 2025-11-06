import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { addDays, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];
type ReminderUpdate = Database["public"]["Tables"]["reminders"]["Update"];

export interface CreateReminderData {
  title: string;
  description?: string;
  category: "booking" | "maintenance" | "follow_up" | "email" | "custom";
  priority?: "low" | "medium" | "high";
  dueDate: Date;
  bookingId?: string;
  recurring?: boolean;
  recurringInterval?: "daily" | "weekly" | "monthly";
  metadata?: Record<string, any>;
}

export const reminderService = {
  /**
   * Get all active reminders (pending or snoozed)
   */
  async getActiveReminders(): Promise<Reminder[]> {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .in("status", ["pending", "snoozed"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching active reminders:", error);
      return [];
    }
  },

  /**
   * Get reminders due today
   */
  async getTodayReminders(): Promise<Reminder[]> {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .in("status", ["pending", "snoozed"])
        .gte("due_date", startOfToday.toISOString())
        .lte("due_date", endOfToday.toISOString())
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Filter out snoozed reminders that are still snoozed
      const now = new Date();
      return (data || []).filter(reminder => {
        if (reminder.status === "snoozed" && reminder.snoozed_until) {
          return isAfter(now, new Date(reminder.snoozed_until));
        }
        return true;
      });
    } catch (error) {
      console.error("Error fetching today's reminders:", error);
      return [];
    }
  },

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(): Promise<Reminder[]> {
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("status", "pending")
        .lt("due_date", now.toISOString())
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching overdue reminders:", error);
      return [];
    }
  },

  /**
   * Create a new reminder
   */
  async createReminder(reminderData: CreateReminderData): Promise<Reminder> {
    try {
      const insertData: ReminderInsert = {
        title: reminderData.title,
        description: reminderData.description || null,
        category: reminderData.category,
        priority: reminderData.priority || "medium",
        due_date: reminderData.dueDate.toISOString(),
        booking_id: reminderData.bookingId || null,
        recurring: reminderData.recurring || false,
        recurring_interval: reminderData.recurringInterval || null,
        metadata: reminderData.metadata || null,
        auto_generated: false,
        status: "pending"
      };

      const { data, error } = await supabase
        .from("reminders")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
  },

  /**
   * Update a reminder
   */
  async updateReminder(id: string, updates: Partial<ReminderUpdate>): Promise<Reminder> {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating reminder:", error);
      throw error;
    }
  },

  /**
   * Snooze a reminder
   */
  async snoozeReminder(id: string, minutes: number): Promise<Reminder> {
    try {
      const snoozeUntil = addMinutes(new Date(), minutes);

      const { data, error } = await supabase
        .from("reminders")
        .update({
          status: "snoozed",
          snoozed_until: snoozeUntil.toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      throw error;
    }
  },

  /**
   * Dismiss a reminder
   */
  async dismissReminder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "dismissed" })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      throw error;
    }
  },

  /**
   * Complete a reminder
   */
  async completeReminder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error completing reminder:", error);
      throw error;
    }
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting reminder:", error);
      throw error;
    }
  },

  /**
   * Auto-generate reminders for a booking
   */
  async generateBookingReminders(bookingId: string, bookingData: {
    eventName: string;
    contactName: string;
    startDate: Date;
    isPending: boolean;
  }): Promise<void> {
    try {
      const reminders: ReminderInsert[] = [];
      const now = new Date();

      // 7-day email reminder
      const sevenDayBefore = addDays(bookingData.startDate, -7);
      if (isAfter(sevenDayBefore, now)) {
        reminders.push({
          title: `Send 7-day reminder email - ${bookingData.eventName}`,
          description: `Send payment reminder email to ${bookingData.contactName}`,
          category: "email",
          priority: "high",
          due_date: sevenDayBefore.toISOString(),
          booking_id: bookingId,
          auto_generated: true,
          status: "pending",
          metadata: { type: "7_day_email", booking_name: bookingData.eventName }
        });
      }

      // 1 week before event notice
      const oneWeekBefore = addDays(bookingData.startDate, -7);
      if (isAfter(oneWeekBefore, now)) {
        reminders.push({
          title: `Event in 1 week - ${bookingData.eventName}`,
          description: `${bookingData.eventName} starts in 1 week. Final preparations needed.`,
          category: "booking",
          priority: "high",
          due_date: oneWeekBefore.toISOString(),
          booking_id: bookingId,
          auto_generated: true,
          status: "pending",
          metadata: { type: "event_notice_1week" }
        });
      }

      // 3 days before event notice
      const threeDaysBefore = addDays(bookingData.startDate, -3);
      if (isAfter(threeDaysBefore, now)) {
        reminders.push({
          title: `Event in 3 days - ${bookingData.eventName}`,
          description: `${bookingData.eventName} is coming up soon. Last-minute checklist.`,
          category: "booking",
          priority: "high",
          due_date: threeDaysBefore.toISOString(),
          booking_id: bookingId,
          auto_generated: true,
          status: "pending",
          metadata: { type: "event_notice_3days" }
        });
      }

      // 1 day before event notice
      const oneDayBefore = addDays(bookingData.startDate, -1);
      if (isAfter(oneDayBefore, now)) {
        reminders.push({
          title: `Event tomorrow - ${bookingData.eventName}`,
          description: `${bookingData.eventName} starts tomorrow. Final checks required.`,
          category: "booking",
          priority: "high",
          due_date: oneDayBefore.toISOString(),
          booking_id: bookingId,
          auto_generated: true,
          status: "pending",
          metadata: { type: "event_notice_1day" }
        });
      }

      // Pending booking follow-up (every 2 days)
      if (bookingData.isPending) {
        const twoDaysFromNow = addDays(now, 2);
        if (isBefore(twoDaysFromNow, bookingData.startDate)) {
          reminders.push({
            title: `Follow up on pending booking - ${bookingData.eventName}`,
            description: `Contact ${bookingData.contactName} about confirming their booking`,
            category: "follow_up",
            priority: "medium",
            due_date: twoDaysFromNow.toISOString(),
            booking_id: bookingId,
            auto_generated: true,
            recurring: true,
            recurring_interval: "daily",
            status: "pending",
            metadata: { type: "pending_follow_up", interval_days: 2 }
          });
        }
      }

      if (reminders.length > 0) {
        const { error } = await supabase
          .from("reminders")
          .insert(reminders);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error generating booking reminders:", error);
      throw error;
    }
  },

  /**
   * Delete all auto-generated reminders for a booking
   */
  async deleteBookingReminders(bookingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("booking_id", bookingId)
        .eq("auto_generated", true);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting booking reminders:", error);
      throw error;
    }
  }
};
