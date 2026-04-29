// Configuration + types for the Event Margin / Profit Calculator tab.
// Persisted in localStorage under key `trout-lake-event-margin`.

export interface AnnualExpense {
  id: string;        // stable id, used as react key
  label: string;     // user-visible name e.g. "Hydro"
  yearlyAmount: number;
}

export interface PerEventExpense {
  id: string;
  label: string;     // e.g. "Cleaning", "Tables rent", "Gas"
  amount: number;    // $ per event
}

export interface BuildingCost {
  id: string;
  name: string;
  yearlyCost: number;       // overhead allocated to this building per year
  perEventCost: number;     // additional cost when this building is used for an event
  cleaningFee: number;      // cleaning charge each time this building is used
  beds: number;             // sleeping capacity — drives auto-allocation by guest count
  capacity?: number;        // legacy field, kept for compat
}

export interface ManagerCostConfig {
  monthlyMaintenanceFee: number;
  commissionPercent: number;          // 0-100
  minimumCommissionPerEvent: number;  // $ floor
}

export interface PerEventDefaults {
  cleaningFee: number;
  additionalCleaningFee: number;
  additionalCleaningThreshold: number; // guest count above which the extra fee applies
}

export interface EventMarginConfig {
  annualExpenses: AnnualExpense[];
  buildings: BuildingCost[];
  perEventDefaults: PerEventDefaults;
  perEventExpenses: PerEventExpense[]; // recurring line items charged on every event
  manager: ManagerCostConfig;
  expectedEventsPerYear: number; // for amortizing annual fixed costs across events
}

export const DEFAULT_EVENT_MARGIN_CONFIG: EventMarginConfig = {
  // Real numbers from MWS spreadsheet — labels preserved verbatim ("/Dec" reflects
  // the December bill the user supplied; multiply by 12 if you want a true annual.)
  annualExpenses: [
    { id: "hydro_661", label: "Hydro 661 / Dec", yearlyAmount: 3692.17 },
    { id: "hydro_677a", label: "Hydro 677a / Dec", yearlyAmount: 69.03 },
    { id: "hydro_669", label: "Hydro 669 / Dec", yearlyAmount: 147.07 },
    { id: "hydro_673", label: "Hydro 673 / Dec", yearlyAmount: 247.75 },
    { id: "hydro_675", label: "Hydro 675 / Dec", yearlyAmount: 471.31 },
    { id: "hydro_677", label: "Hydro 677 / Dec", yearlyAmount: 357.79 },
    { id: "snow_removal_annual", label: "Snow removal (annual)", yearlyAmount: 9000 },
    { id: "maintenance_annual", label: "Maintenance (annual)", yearlyAmount: 6000 },
    { id: "marketing_annual", label: "Marketing (annual)", yearlyAmount: 3000 },
  ],
  // 5 buildings — addresses from your hydro bills. Per-building yearly/per-event
  // costs left at 0 since hydro is captured in annualExpenses already.
  // 5 buildings — beds total 128 (36 main + 4×23 satellites). Used for auto-allocation:
  // guests fill main first, then overflow to satellites in order. Each occupied building
  // adds its cleaningFee to the event total.
  buildings: [
    { id: "661", name: "661 (main)",  yearlyCost: 0, perEventCost: 0, cleaningFee: 1500, beds: 36, capacity: 36 },
    { id: "669", name: "669",         yearlyCost: 0, perEventCost: 0, cleaningFee: 1000, beds: 23, capacity: 23 },
    { id: "673", name: "673",         yearlyCost: 0, perEventCost: 0, cleaningFee: 1000, beds: 23, capacity: 23 },
    { id: "675", name: "675",         yearlyCost: 0, perEventCost: 0, cleaningFee: 1000, beds: 23, capacity: 23 },
    { id: "677", name: "677 (+ 677a)", yearlyCost: 0, perEventCost: 0, cleaningFee: 1000, beds: 23, capacity: 23 },
  ],
  perEventDefaults: {
    // Conditional cleaning is unused now — your per-event list below covers cleaning explicitly.
    cleaningFee: 0,
    additionalCleaningFee: 0,
    additionalCleaningThreshold: 50,
  },
  // Cleaning has been moved to a per-building fee (see buildings[].cleaningFee).
  // Management fee is now a flat per-event line item (was previously amortized monthly).
  perEventExpenses: [
    { id: "tables_rent", label: "Tables rent", amount: 300 },
    { id: "gas", label: "Gas", amount: 250 },
    { id: "hydro_weekly", label: "Hydro (weekly during event)", amount: 1246.28 },
    { id: "snow_weekly", label: "Snow removal (weekly)", amount: 450 },
    { id: "maintenance_weekly", label: "Maintenance (weekly)", amount: 300 },
    { id: "management_fee", label: "Management fee", amount: 1000 },
    { id: "marketing_event", label: "Marketing (per event)", amount: 150 },
    { id: "garbage", label: "Garbage", amount: 180 },
    { id: "cleaning_shabbos", label: "Cleaning - Shabbos", amount: 1500 },
  ],
  manager: {
    monthlyMaintenanceFee: 1000,
    commissionPercent: 15,
    minimumCommissionPerEvent: 1000,
  },
  expectedEventsPerYear: 30,
};

export interface EventMarginInputs {
  totalRevenue: number;
  numberOfGuests: number;
  buildingIds: string[]; // one or more buildings — leave empty to auto-allocate by guest count
  // optional override of cleaning fee for this event (defaults to perEventDefaults)
  cleaningFeeOverride?: number;
  manualEventExpenses?: number; // ad-hoc add-ons (food, decorations, staff, etc.)
}

/**
 * Auto-allocate buildings for an event based on guest count.
 * Fills the FIRST building (main) up to its bed count, then overflows into
 * additional buildings in the order they appear in the config until all
 * guests are housed. Returns the buildings that would be in use.
 */
export function allocateBuildingsForGuests(
  guests: number,
  buildings: BuildingCost[]
): BuildingCost[] {
  if (guests <= 0 || !buildings.length) return [];
  const result: BuildingCost[] = [];
  let remaining = guests;
  for (const b of buildings) {
    result.push(b);
    remaining -= Number(b.beds) || 0;
    if (remaining <= 0) break;
  }
  return result;
}

export interface EventMarginBreakdown {
  managerCommission: number;        // 15% revenue, min $1k floor
  buildingCleaningTotal: number;    // sum of cleaningFee on selected buildings
  perEventExpensesTotal: number;    // sum of recurring per-event line items
  buildingPerEventCost: number;     // sum of selected buildings' perEventCost
  allocatedAnnualOverhead: number;  // sum(annualExpenses) / expectedEventsPerYear
  managerMonthlyAllocation: number; // monthlyMaintenanceFee * 12 / expectedEventsPerYear
  manualEventExpenses: number;
  totalExpenses: number;
  netProfit: number;                // revenue - totalExpenses
  marginPercent: number;            // netProfit / revenue * 100
  profitPerPerson: number;          // netProfit / numberOfGuests
  revenuePerPerson: number;
}

export function calculateEventMargin(
  inputs: EventMarginInputs,
  config: EventMarginConfig
): EventMarginBreakdown {
  const { totalRevenue, numberOfGuests, buildingIds, cleaningFeeOverride, manualEventExpenses } = inputs;

  const managerCommission = Math.max(
    totalRevenue * (config.manager.commissionPercent / 100),
    config.manager.minimumCommissionPerEvent
  );

  // If buildings aren't explicitly picked, auto-allocate based on guest count.
  // Main building fills first, then overflow into satellites until everyone has a bed.
  const selectedBuildings =
    buildingIds.length > 0
      ? config.buildings.filter((b) => buildingIds.includes(b.id))
      : allocateBuildingsForGuests(numberOfGuests, config.buildings);
  const buildingPerEventCost = selectedBuildings.reduce((s, b) => s + (b.perEventCost || 0), 0);
  // Cleaning is per-building (e.g. main $1,500, satellites $1,000 each).
  // Override (cleaningFeeOverride) wins if user typed a custom number.
  const buildingCleaningSum = selectedBuildings.reduce((s, b) => s + (b.cleaningFee || 0), 0);
  const buildingCleaningTotal = cleaningFeeOverride ?? buildingCleaningSum;

  // Annual fixed overhead and the monthly management fee are NOT allocated per event anymore.
  // The user now models management as a flat line in perEventExpenses.
  const allocatedAnnualOverhead = 0;
  const managerMonthlyAllocation = 0;

  const manual = manualEventExpenses || 0;
  const perEventExpensesTotal = (config.perEventExpenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );

  const totalExpenses =
    managerCommission +
    buildingCleaningTotal +
    perEventExpensesTotal +
    buildingPerEventCost +
    manual;

  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const profitPerPerson = numberOfGuests > 0 ? netProfit / numberOfGuests : 0;
  const revenuePerPerson = numberOfGuests > 0 ? totalRevenue / numberOfGuests : 0;

  return {
    managerCommission,
    buildingCleaningTotal,
    perEventExpensesTotal,
    buildingPerEventCost,
    allocatedAnnualOverhead,
    managerMonthlyAllocation,
    manualEventExpenses: manual,
    totalExpenses,
    netProfit,
    marginPercent,
    profitPerPerson,
    revenuePerPerson,
  };
}
