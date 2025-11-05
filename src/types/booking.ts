
import type { Database } from "@/integrations/supabase/types";

// Raw Supabase types, using snake_case as the source of truth
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  payments: Payment[];
};
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

// Application-level enums/types
export type BookingType = "yom_tov" | "shabaton" | "night_event";
export type PaymentStatus = "pending" | "deposit_paid" | "partial" | "paid" | "refunded" | "cancelled";
export type PaymentMethod = "cash" | "check" | "credit_card" | "bank_transfer" | "venmo" | "zelle" | "other" | "pending";

export interface ManagerPayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  type: "maintenance" | "commission" | "other";
  relatedBookingId?: string;
  notes: string;
  createdAt: string;
}

export interface ManagerSalaryData {
  maintenanceFeePerMonth: number;
  commissionPercentage: number;
  minimumCommissionPerEvent: number;
  seasonStart: string;
  seasonEnd: string;
  payments: ManagerPayment[];
}

export interface PricingConfig {
  baseRate: number;
  perPersonRate: number;
  perPersonRateOver75: number;
  cleaningFee: number;
  additionalCleaningFeeThreshold: number;
  additionalCleaningFee: number;
  nightEventRate: number;
  nightEventCleaningFee: number;
  depositPercentageFirst: number;
  depositPercentageSecond: number;
  balancePercentage: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  baseRate: 6000,
  perPersonRate: 125,
  perPersonRateOver75: 105,
  cleaningFee: 2000,
  additionalCleaningFeeThreshold: 50,
  additionalCleaningFee: 500,
  nightEventRate: 1500,
  nightEventCleaningFee: 500,
  depositPercentageFirst: 25,
  depositPercentageSecond: 25,
  balancePercentage: 50,
};
