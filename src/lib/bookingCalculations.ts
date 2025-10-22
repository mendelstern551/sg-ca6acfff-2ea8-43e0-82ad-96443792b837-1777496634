
import { DEFAULT_PRICING, PricingConfig } from "@/types/booking";

export function calculateBookingCost(
  bookingType: "yom_tov" | "shabaton" | "night_event",
  numberOfGuests: number,
  pricing: PricingConfig = DEFAULT_PRICING
): {
  baseRate: number;
  perPersonRate: number;
  perPersonTotal: number;
  cleaningFee: number;
  additionalCleaningFee: number;
  totalCost: number;
  depositFirst: number;
  depositSecond: number;
  balance: number;
} {
  if (bookingType === "night_event") {
    const totalCost = pricing.nightEventRate + pricing.nightEventCleaningFee;
    return {
      baseRate: pricing.nightEventRate,
      perPersonRate: 0,
      perPersonTotal: 0,
      cleaningFee: pricing.nightEventCleaningFee,
      additionalCleaningFee: 0,
      totalCost,
      depositFirst: totalCost * (pricing.depositPercentageFirst / 100),
      depositSecond: totalCost * (pricing.depositPercentageSecond / 100),
      balance: totalCost * (pricing.balancePercentage / 100),
    };
  }

  const baseRate = pricing.baseRate;
  const perPersonRate = numberOfGuests > 75 ? pricing.perPersonRateOver75 : pricing.perPersonRate;
  const perPersonTotal = numberOfGuests * perPersonRate;
  const cleaningFee = pricing.cleaningFee;
  const additionalCleaningFee =
    numberOfGuests > pricing.additionalCleaningFeeThreshold
      ? Math.ceil((numberOfGuests - pricing.additionalCleaningFeeThreshold) / 50) *
        pricing.additionalCleaningFee
      : 0;

  const totalCost = baseRate + perPersonTotal + cleaningFee + additionalCleaningFee;

  return {
    baseRate,
    perPersonRate,
    perPersonTotal,
    cleaningFee,
    additionalCleaningFee,
    totalCost,
    depositFirst: totalCost * (pricing.depositPercentageFirst / 100),
    depositSecond: totalCost * (pricing.depositPercentageSecond / 100),
    balance: totalCost * (pricing.balancePercentage / 100),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
