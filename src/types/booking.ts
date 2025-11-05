export type BookingType = "yom_tov" | "shabaton" | "night_event";

export type PaymentStatus = "pending" | "deposit_paid" | "partial" | "paid" | "refunded" | "cancelled";

export type PaymentMethod = "cash" | "check" | "credit_card" | "bank_transfer" | "venmo" | "zelle" | "other";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  payment_date: string; // Changed from date to match db
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface Booking {
  id: string;
  bookingType: BookingType;
  name: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
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
  paymentStatus: PaymentStatus;
  confirmed: boolean;
  payments: Payment[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customPrice: number | null;
  discountPercent: number | null;
}

export interface Expense {
  id: string;
  bookingId: string | null;
  date: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  vendor: string | null;
  receiptUrls: string[] | null;
  proofUrls: string[] | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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