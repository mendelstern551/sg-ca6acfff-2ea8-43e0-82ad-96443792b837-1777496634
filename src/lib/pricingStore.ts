// Pricing config — backed by Supabase via the shared app_settings store so
// changes in Settings → Pricing sync to every device. Falls back to
// localStorage offline / before the migration is applied.

import { DEFAULT_PRICING, PricingConfig } from "@/types/booking";
import { useAppSetting, saveAppSetting } from "@/lib/settingsStore";

// Key matches legacy localStorage name (`trout-lake-pricing-config`) so existing
// per-device data is read on first load instead of being orphaned.
const KEY = "pricing-config";

export function usePricingConfig(): PricingConfig {
  return useAppSetting<PricingConfig>(KEY, DEFAULT_PRICING);
}

export async function savePricingConfig(config: PricingConfig): Promise<void> {
  await saveAppSetting(KEY, config);
}

export async function resetPricingConfig(): Promise<void> {
  await saveAppSetting(KEY, DEFAULT_PRICING);
}

// Synchronous read for non-React callers — reads localStorage mirror only.
// Use usePricingConfig() in components to get live updates from any device.
export function loadPricingConfig(): PricingConfig {
  if (typeof window === "undefined") return DEFAULT_PRICING;
  try {
    const raw = window.localStorage.getItem("trout-lake-" + KEY);
    if (!raw) return DEFAULT_PRICING;
    return { ...DEFAULT_PRICING, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRICING;
  }
}
