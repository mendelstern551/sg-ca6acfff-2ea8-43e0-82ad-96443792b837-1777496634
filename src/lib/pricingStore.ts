// Centralized pricing config — read by BookingDialog and editable from the Settings tab.
// Persisted in localStorage so changes propagate across components without a refresh.

import { DEFAULT_PRICING, PricingConfig } from "@/types/booking";

const STORAGE_KEY = "trout-lake-pricing-config";
const EVENT_NAME = "pricing-config:changed";

export function loadPricingConfig(): PricingConfig {
  if (typeof window === "undefined") return DEFAULT_PRICING;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRICING;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PRICING, ...parsed };
  } catch {
    return DEFAULT_PRICING;
  }
}

export function savePricingConfig(config: PricingConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Notify all live components so they rerender without a full reload.
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
}

export function resetPricingConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_PRICING }));
}

// React hook helper — usage:
//   const pricing = usePricingConfig();
import { useEffect, useState } from "react";

export function usePricingConfig(): PricingConfig {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  useEffect(() => {
    setPricing(loadPricingConfig());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<PricingConfig>).detail;
      if (detail) setPricing(detail);
      else setPricing(loadPricingConfig());
    };
    window.addEventListener(EVENT_NAME, onChange);
    // Also react to localStorage changes from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPricing(loadPricingConfig());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return pricing;
}
