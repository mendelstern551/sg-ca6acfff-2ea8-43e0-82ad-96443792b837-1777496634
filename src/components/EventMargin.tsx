import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_EVENT_MARGIN_CONFIG,
  EventMarginConfig,
  AnnualExpense,
  BuildingCost,
  PerEventExpense,
  calculateEventMargin,
  EventMarginInputs,
} from "@/types/eventMargin";
import { loadAppSetting, saveAppSetting } from "@/lib/settingsStore";
import { Booking } from "@/types/booking";
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown, Save, RotateCcw, DollarSign, X, ChevronDown, ChevronRight } from "lucide-react";

// Matches legacy localStorage key `trout-lake-event-margin`.
const SETTINGS_KEY = "event-margin";

interface EventMarginProps {
  bookings: Booking[];
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtPrecise = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function normalizeConfig(parsed: Partial<EventMarginConfig> | null | undefined): EventMarginConfig {
  if (!parsed) return DEFAULT_EVENT_MARGIN_CONFIG;
  return {
    ...DEFAULT_EVENT_MARGIN_CONFIG,
    ...parsed,
    annualExpenses: Array.isArray(parsed.annualExpenses)
      ? parsed.annualExpenses
      : DEFAULT_EVENT_MARGIN_CONFIG.annualExpenses,
    buildings: Array.isArray(parsed.buildings)
      ? parsed.buildings
      : DEFAULT_EVENT_MARGIN_CONFIG.buildings,
    perEventExpenses: Array.isArray(parsed.perEventExpenses)
      ? parsed.perEventExpenses
      : DEFAULT_EVENT_MARGIN_CONFIG.perEventExpenses,
    perEventDefaults: { ...DEFAULT_EVENT_MARGIN_CONFIG.perEventDefaults, ...(parsed.perEventDefaults || {}) },
    manager: { ...DEFAULT_EVENT_MARGIN_CONFIG.manager, ...(parsed.manager || {}) },
  };
}

export function EventMargin({ bookings }: EventMarginProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<EventMarginConfig>(DEFAULT_EVENT_MARGIN_CONFIG);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  // Calculator state
  const [revenue, setRevenue] = useState<number>(0);
  const [guests, setGuests] = useState<number>(0);
  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [cleaningOverride, setCleaningOverride] = useState<string>("");
  const [manualExtras, setManualExtras] = useState<string>("");
  const [pickedBookingId, setPickedBookingId] = useState<string>("");
  const [showPerEventDetail, setShowPerEventDetail] = useState(false);
  const [showCleaningDetail, setShowCleaningDetail] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAppSetting<EventMarginConfig>(SETTINGS_KEY, DEFAULT_EVENT_MARGIN_CONFIG).then((raw) => {
      if (!alive) return;
      const loaded = normalizeConfig(raw);
      setConfig(loaded);
      setSavedSnapshot(JSON.stringify(loaded));
    });
    return () => { alive = false; };
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(config) !== savedSnapshot,
    [config, savedSnapshot]
  );

  const inputs: EventMarginInputs = useMemo(
    () => ({
      totalRevenue: revenue,
      numberOfGuests: guests,
      buildingIds,
      cleaningFeeOverride: cleaningOverride === "" ? undefined : parseFloat(cleaningOverride) || 0,
      manualEventExpenses: manualExtras === "" ? undefined : parseFloat(manualExtras) || 0,
    }),
    [revenue, guests, buildingIds, cleaningOverride, manualExtras]
  );

  const toggleBuilding = (id: string) =>
    setBuildingIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));

  const breakdown = useMemo(() => calculateEventMargin(inputs, config), [inputs, config]);

  const totalAnnual = useMemo(() => {
    const expenses = config.annualExpenses.reduce((s, e) => s + (Number(e.yearlyAmount) || 0), 0);
    const buildings = config.buildings.reduce((s, b) => s + (Number(b.yearlyCost) || 0), 0);
    const managerYearly = (Number(config.manager.monthlyMaintenanceFee) || 0) * 12;
    return { expenses, buildings, managerYearly, total: expenses + buildings + managerYearly };
  }, [config]);

  const handleSave = async () => {
    const result = await saveAppSetting(SETTINGS_KEY, config);
    setSavedSnapshot(JSON.stringify(config));
    toast({
      title: "Settings saved",
      description: result.remote
        ? "Cost configuration synced to all devices."
        : "Saved locally — Supabase app_settings table not available yet.",
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_EVENT_MARGIN_CONFIG);
    toast({ title: "Reverted to defaults", description: "Click Save to persist." });
  };

  // ---- annual expenses ----
  const updateAnnual = (id: string, patch: Partial<AnnualExpense>) =>
    setConfig((c) => ({
      ...c,
      annualExpenses: c.annualExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const addAnnual = () =>
    setConfig((c) => ({
      ...c,
      annualExpenses: [
        ...c.annualExpenses,
        { id: `custom_${Date.now()}`, label: "New expense", yearlyAmount: 0 },
      ],
    }));
  const removeAnnual = (id: string) =>
    setConfig((c) => ({ ...c, annualExpenses: c.annualExpenses.filter((e) => e.id !== id) }));

  // ---- per-event expenses ----
  const updatePerEvent = (id: string, patch: Partial<PerEventExpense>) =>
    setConfig((c) => ({
      ...c,
      perEventExpenses: c.perEventExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const addPerEvent = () =>
    setConfig((c) => ({
      ...c,
      perEventExpenses: [
        ...c.perEventExpenses,
        { id: `pe_${Date.now()}`, label: "New per-event expense", amount: 0 },
      ],
    }));
  const removePerEvent = (id: string) =>
    setConfig((c) => ({ ...c, perEventExpenses: c.perEventExpenses.filter((e) => e.id !== id) }));

  // ---- buildings ----
  const updateBuilding = (id: string, patch: Partial<BuildingCost>) =>
    setConfig((c) => ({
      ...c,
      buildings: c.buildings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  const addBuilding = () =>
    setConfig((c) => ({
      ...c,
      buildings: [
        ...c.buildings,
        {
          id: `b_${Date.now()}`,
          name: `Building ${c.buildings.length + 1}`,
          yearlyCost: 0,
          perEventCost: 0,
          cleaningFee: 1000,
          beds: 23,
          capacity: 23,
        },
      ],
    }));
  const removeBuilding = (id: string) =>
    setConfig((c) => ({ ...c, buildings: c.buildings.filter((b) => b.id !== id) }));

  // ---- pick booking → autofill calculator ----
  const handlePickBooking = (id: string) => {
    setPickedBookingId(id);
    if (!id) return;
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    setRevenue(Number(b.total_cost) || 0);
    setGuests(Number(b.number_of_guests) || 0);
  };

  return (
    <div className="space-y-6">
      {/* COST CONFIG */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Configuration
              </CardTitle>
              <CardDescription>
                Fill in your annual + per-event costs. The calculator below uses these to compute margin.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button onClick={handleSave} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-1" /> {isDirty ? "Save" : "Saved"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Annual fixed expenses */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Annual fixed expenses</h3>
                <p className="text-xs text-muted-foreground">
                  Total per year. These are amortized across {config.expectedEventsPerYear || 0} events.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addAnnual}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {config.annualExpenses.map((e) => (
                <div key={e.id} className="grid grid-cols-1 md:grid-cols-[1fr_180px_40px] gap-2 items-center">
                  <Input
                    value={e.label}
                    onChange={(ev) => updateAnnual(e.id, { label: ev.target.value })}
                    placeholder="Expense name"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={e.yearlyAmount === 0 ? "" : e.yearlyAmount}
                    onChange={(ev) =>
                      updateAnnual(e.id, { yearlyAmount: parseFloat(ev.target.value) || 0 })
                    }
                    placeholder="Yearly $"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAnnual(e.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Per-event expenses */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Per-event expenses</h3>
                <p className="text-xs text-muted-foreground">
                  Charged on every event. The calculator adds these on top of the manager fee + cleaning + overhead.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addPerEvent}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {config.perEventExpenses.map((e) => (
                <div key={e.id} className="grid grid-cols-1 md:grid-cols-[1fr_180px_40px] gap-2 items-center">
                  <Input
                    value={e.label}
                    onChange={(ev) => updatePerEvent(e.id, { label: ev.target.value })}
                    placeholder="Expense name"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={e.amount === 0 ? "" : e.amount}
                    onChange={(ev) =>
                      updatePerEvent(e.id, { amount: parseFloat(ev.target.value) || 0 })
                    }
                    placeholder="$ per event"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePerEvent(e.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Buildings */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Buildings</h3>
              <Button variant="outline" size="sm" onClick={addBuilding}>
                <Plus className="h-4 w-4 mr-1" /> Add building
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Total beds: <strong>{config.buildings.reduce((s, b) => s + (Number(b.beds) || 0), 0)}</strong>.
              Guests fill the first building first, then overflow into the next in order.
            </p>
            <div className="hidden md:grid grid-cols-[1.4fr_100px_100px_110px_90px_90px_40px] gap-2 px-1 pb-1 text-xs text-muted-foreground">
              <span>Name</span>
              <span>Yearly $</span>
              <span>Per-event $</span>
              <span>Cleaning $</span>
              <span>Beds</span>
              <span>Capacity</span>
              <span></span>
            </div>
            <div className="space-y-2">
              {config.buildings.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-1 md:grid-cols-[1.4fr_100px_100px_110px_90px_90px_40px] gap-2 items-center"
                >
                  <Input
                    value={b.name}
                    onChange={(ev) => updateBuilding(b.id, { name: ev.target.value })}
                    placeholder="Building name"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={b.yearlyCost === 0 ? "" : b.yearlyCost}
                    onChange={(ev) =>
                      updateBuilding(b.id, { yearlyCost: parseFloat(ev.target.value) || 0 })
                    }
                    placeholder="Yearly $"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={b.perEventCost === 0 ? "" : b.perEventCost}
                    onChange={(ev) =>
                      updateBuilding(b.id, { perEventCost: parseFloat(ev.target.value) || 0 })
                    }
                    placeholder="Per-event $"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={b.cleaningFee === 0 ? "" : b.cleaningFee}
                    onChange={(ev) =>
                      updateBuilding(b.id, { cleaningFee: parseFloat(ev.target.value) || 0 })
                    }
                    placeholder="Cleaning $"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={b.beds === 0 ? "" : b.beds}
                    onChange={(ev) => updateBuilding(b.id, { beds: parseInt(ev.target.value) || 0 })}
                    placeholder="Beds"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={b.capacity ?? ""}
                    onChange={(ev) => updateBuilding(b.id, { capacity: parseInt(ev.target.value) || 0 })}
                    placeholder="Capacity"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBuilding(b.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Manager commission */}
          <section>
            <h3 className="font-semibold mb-1">Manager commission</h3>
            <p className="text-xs text-muted-foreground mb-3">
              The flat monthly management fee belongs in the per-event list above. These two
              just control the variable commission applied to each booking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Commission % per event</Label>
                <Input
                  type="number"
                  value={config.manager.commissionPercent || ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      manager: { ...c.manager, commissionPercent: parseFloat(e.target.value) || 0 },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Minimum commission per event ($)</Label>
                <Input
                  type="number"
                  value={config.manager.minimumCommissionPerEvent || ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      manager: {
                        ...c.manager,
                        minimumCommissionPerEvent: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      {/* CALCULATOR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Event Profit Calculator
          </CardTitle>
          <CardDescription>
            Pick an existing booking or enter values manually to see expenses, profit, and per-person numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Pick a booking (optional)</Label>
              <div className="flex gap-2">
                <Select value={pickedBookingId} onValueChange={handlePickBooking}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Or fill values below…" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {b.start_date?.slice(0, 10) || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pickedBookingId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setPickedBookingId("");
                      setRevenue(0);
                      setGuests(0);
                    }}
                    aria-label="Clear booking selection"
                    title="Clear — calculate without a customer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Not required — leave blank or click ✕ to enter numbers manually.
              </p>
            </div>
            <div>
              <Label>Total revenue ($)</Label>
              <Input
                type="number"
                value={revenue || ""}
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Number of guests</Label>
              <Input
                type="number"
                value={guests || ""}
                onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Buildings used (pick one or more)</Label>
                {buildingIds.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setBuildingIds([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {config.buildings.map((b) => {
                  const selected = buildingIds.includes(b.id);
                  return (
                    <Button
                      key={b.id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBuilding(b.id)}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {b.name}
                      {b.capacity ? ` (${b.capacity})` : ""}
                    </Button>
                  );
                })}
              </div>
              {buildingIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {buildingIds.length} building{buildingIds.length === 1 ? "" : "s"} selected
                  — per-event cost summed.
                </p>
              )}
            </div>
            <div>
              <Label>Cleaning override (optional)</Label>
              <Input
                type="number"
                placeholder={`Default ${fmt(config.perEventDefaults.cleaningFee)}`}
                value={cleaningOverride}
                onChange={(e) => setCleaningOverride(e.target.value)}
              />
            </div>
            <div>
              <Label>Other event expenses ($)</Label>
              <Input
                type="number"
                placeholder="Food, decor, staff, etc."
                value={manualExtras}
                onChange={(e) => setManualExtras(e.target.value)}
              />
            </div>
          </div>

          {/* Result panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Expense breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row
                  label="Manager commission"
                  value={breakdown.managerCommission}
                  note={`${config.manager.commissionPercent}% / min ${fmt(config.manager.minimumCommissionPerEvent)}`}
                />

                {/* Building cleaning — expandable */}
                <ExpandableRow
                  label="Building cleaning"
                  value={breakdown.buildingCleaningTotal}
                  expanded={showCleaningDetail}
                  onToggle={() => setShowCleaningDetail((v) => !v)}
                  note={
                    buildingIds.length === 0
                      ? "no buildings selected"
                      : `${buildingIds.length} building${buildingIds.length === 1 ? "" : "s"}`
                  }
                  details={
                    buildingIds.length === 0
                      ? [{ key: "none", label: "Select buildings to see cleaning fees", value: 0 }]
                      : config.buildings
                          .filter((b) => buildingIds.includes(b.id))
                          .map((b) => ({ key: b.id, label: b.name, value: b.cleaningFee || 0 }))
                  }
                />

                {/* Per-event expenses — expandable */}
                <ExpandableRow
                  label="Per-event expenses"
                  value={breakdown.perEventExpensesTotal}
                  expanded={showPerEventDetail}
                  onToggle={() => setShowPerEventDetail((v) => !v)}
                  note={`${config.perEventExpenses.length} item${
                    config.perEventExpenses.length === 1 ? "" : "s"
                  }`}
                  details={config.perEventExpenses.map((e) => ({
                    key: e.id,
                    label: e.label,
                    value: e.amount,
                  }))}
                />

                <Row label="Building per-event" value={breakdown.buildingPerEventCost} />
                <Row label="Other event expenses" value={breakdown.manualEventExpenses} />
                <Separator className="my-2" />
                <Row label="Total expenses" value={breakdown.totalExpenses} bold />
              </CardContent>
            </Card>

            <Card
              className={
                "border-2 " +
                (breakdown.netProfit >= 0
                  ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800")
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {breakdown.netProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  Profit summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-lg font-semibold">{fmt(revenue)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Net profit</span>
                  <span
                    className={
                      "text-2xl font-bold " +
                      (breakdown.netProfit >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")
                    }
                  >
                    {fmt(breakdown.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Margin</span>
                  <Badge variant={breakdown.netProfit >= 0 ? "default" : "destructive"}>
                    {breakdown.marginPercent.toFixed(1)}%
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Revenue / person</div>
                    <div className="font-semibold">{fmtPrecise(breakdown.revenuePerPerson)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Profit / person</div>
                    <div
                      className={
                        "font-semibold " +
                        (breakdown.profitPerPerson >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")
                      }
                    >
                      {fmtPrecise(breakdown.profitPerPerson)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  bold,
}: {
  label: string;
  value: number;
  note?: string;
  bold?: boolean;
}) {
  return (
    <div className={"flex justify-between items-baseline " + (bold ? "font-semibold" : "")}>
      <span>
        {label}
        {note && <span className="text-xs text-muted-foreground ml-1">({note})</span>}
      </span>
      <span>{fmt(value)}</span>
    </div>
  );
}

function ExpandableRow({
  label,
  value,
  note,
  expanded,
  onToggle,
  details,
}: {
  label: string;
  value: number;
  note?: string;
  expanded: boolean;
  onToggle: () => void;
  details: { key: string; label: string; value: number }[];
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-baseline hover:bg-muted/40 rounded -mx-1 px-1 py-0.5 transition-colors"
      >
        <span className="flex items-center gap-1">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {label}
          {note && <span className="text-xs text-muted-foreground ml-1">({note})</span>}
        </span>
        <span>{fmt(value)}</span>
      </button>
      {expanded && (
        <div className="ml-5 mt-1 mb-1 pl-3 border-l-2 border-muted space-y-0.5">
          {details.map((d) => (
            <div key={d.key} className="flex justify-between text-xs text-muted-foreground">
              <span>{d.label}</span>
              <span>{fmt(d.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
