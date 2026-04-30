import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];

export type Payment = PaymentRow;

/**
 * Recompute amount_paid / balance_due / payment_status on the parent booking
 * from its current payment rows. Called after every create/update/delete so the
 * stored totals never drift from the underlying ledger.
 *
 * Uses cents-precision rounding so floating-point math doesn't leave
 * a $0.0000001 ghost balance that flips a paid booking to "partial".
 */
async function syncBookingTotals(bookingId: string): Promise<void> {
  if (!bookingId) return;
  try {
    const [bRes, pRes] = await Promise.all([
      supabase.from("bookings").select("total_cost").eq("id", bookingId).maybeSingle(),
      supabase.from("payments").select("amount").eq("booking_id", bookingId),
    ]);
    if (bRes.error || pRes.error) {
      console.warn("syncBookingTotals: lookup failed", bRes.error || pRes.error);
      return;
    }
    const totalCost = Math.round((Number(bRes.data?.total_cost) || 0) * 100) / 100;
    const totalPaid = Math.round(
      (pRes.data || []).reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100
    ) / 100;
    const balanceDue = Math.round((totalCost - totalPaid) * 100) / 100;

    // <= 1 cent slack absorbs float noise. Status reflects the LEDGER, not stored value.
    let status: "paid" | "partial" | "pending";
    if (totalPaid <= 0) status = "pending";
    else if (balanceDue <= 0.01) status = "paid";
    else status = "partial";

    const { error: upErr } = await supabase
      .from("bookings")
      .update({
        amount_paid: totalPaid,
        balance_due: balanceDue < 0 ? 0 : balanceDue,
        payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    if (upErr) console.warn("syncBookingTotals: update failed", upErr);
  } catch (err) {
    console.warn("syncBookingTotals threw:", err);
  }
}

export const paymentService = {
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPayment(payment: Omit<PaymentInsert, "id" | "created_at" | "updated_at">): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .insert([payment])
      .select()
      .single();

    if (error) throw error;
    // Sync the parent booking so the UI's stored totals match the new ledger.
    if (payment.booking_id) await syncBookingTotals(payment.booking_id);
    return data as Payment;
  },

  async updatePayment(id: string, updates: PaymentUpdate): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const bookingId = (data as { booking_id?: string } | null)?.booking_id;
    if (bookingId) await syncBookingTotals(bookingId);
    return data as Payment;
  },

  async deletePayment(id: string): Promise<void> {
    // Look up the booking_id BEFORE deletion so we can resync its totals.
    const { data: existing } = await supabase
      .from("payments")
      .select("booking_id")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    if (existing?.booking_id) await syncBookingTotals(existing.booking_id);
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Manually re-sync totals for a booking (useful after bulk edits). */
  async resyncBookingTotals(bookingId: string): Promise<void> {
    return syncBookingTotals(bookingId);
  },
};
