export type BookingType = "yom_tov" | "shabaton" | "night_event";

export type PaymentStatus = "pending" | "deposit_paid" | "partial" | "paid" | "refunded" | "cancelled";

export type PaymentMethod = "cash" | "check" | "credit_card" | "bank_transfer" | "venmo" | "zelle" | "other";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  type: BookingType;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  startDate: string;
  endDate: string;
  numberOfGuests: number;
  baseRate: number;
  perPersonRate: number;
  cleaningFee: number;
  additionalCleaningFee: number;
  totalCost: number;
  depositAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: "pending" | "deposit_paid" | "partial" | "paid" | "refunded" | "cancelled";
  confirmed: boolean;
  payments?: Payment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  bookingId?: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  vendor: string;
  receiptUrl?: string;
  proofOfPaymentUrl?: string;
  notes: string;
  createdAt: string;
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
