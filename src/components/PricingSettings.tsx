import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PRICING, PricingConfig } from "@/types/booking";
import { loadPricingConfig, savePricingConfig, resetPricingConfig } from "@/lib/pricingStore";
import { Save, RotateCcw, DollarSign } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface FieldGroup {
  title: string;
  description?: string;
  fields: Array<{ key: keyof PricingConfig; label: string; help?: string; suffix?: string }>;
}

const GROUPS: FieldGroup[] = [
  {
    title: "Per-person rates",
    description:
      "Charged on every booking. Set both rates to the same number for a flat per-person price.",
    fields: [
      { key: "perPersonRate", label: "Standard rate", suffix: "$ / guest" },
      { key: "perPersonRateOver75", label: "Rate when guests > 75", suffix: "$ / guest" },
      { key: "baseRate", label: "Flat base rate (added on top)", suffix: "$" },
    ],
  },
  {
    title: "Cleaning fees",
    description: "Set both to 0 if cleaning is built into the per-person rate.",
    fields: [
      { key: "cleaningFee", label: "Cleaning fee", suffix: "$" },
      { key: "additionalCleaningFee", label: "Additional cleaning fee (large groups)", suffix: "$" },
      {
        key: "additionalCleaningFeeThreshold",
        label: "Triggered above…",
        suffix: "guests",
      },
    ],
  },
  {
    title: "Night event",
    fields: [
      { key: "nightEventRate", label: "Night event rate", suffix: "$" },
      { key: "nightEventCleaningFee", label: "Night event cleaning", suffix: "$" },
    ],
  },
  {
    title: "Deposit schedule (% of total)",
    description: "All three should add up to 100. The booking dialog uses these to suggest payment schedule.",
    fields: [
      { key: "depositPercentageFirst", label: "First deposit", suffix: "%" },
      { key: "depositPercentageSecond", label: "Second deposit", suffix: "%" },
      { key: "balancePercentage", label: "Final balance", suffix: "%" },
    ],
  },
];

export function PricingSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  useEffect(() => {
    const c = loadPricingConfig();
    setConfig(c);
    setSavedSnapshot(JSON.stringify(c));
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(config) !== savedSnapshot,
    [config, savedSnapshot]
  );

  const update = (key: keyof PricingConfig, value: number) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const handleSave = async () => {
    const result = await savePricingConfig(config);
    setSavedSnapshot(JSON.stringify(config));
    if (result.staleConflict) {
      toast({
        title: "Saved locally — another device updated first",
        description: "Reload to pull in the latest, then re-apply your changes.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Pricing saved", description: "New defaults will apply to new bookings." });
    }
  };

  const handleReset = async () => {
    await resetPricingConfig();
    setConfig(DEFAULT_PRICING);
    setSavedSnapshot(JSON.stringify(DEFAULT_PRICING));
    toast({ title: "Reverted to defaults", description: "Saved." });
  };

  // Live preview: 50-guest event price
  const preview50 = config.baseRate + 50 * config.perPersonRate + config.cleaningFee;
  const preview100 =
    config.baseRate +
    100 * (100 > 75 ? config.perPersonRateOver75 : config.perPersonRate) +
    config.cleaningFee +
    (100 > config.additionalCleaningFeeThreshold ? config.additionalCleaningFee : 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Defaults
              </CardTitle>
              <CardDescription>
                Edit the prices used when creating new bookings. Existing bookings keep
                whatever they were created with.
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
          {GROUPS.map((g, idx) => (
            <section key={g.title}>
              <h3 className="font-semibold">{g.title}</h3>
              {g.description && (
                <p className="text-xs text-muted-foreground mb-3">{g.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {g.fields.map((f) => (
                  <div key={f.key}>
                    <Label className="flex items-baseline justify-between">
                      <span>{f.label}</span>
                      {f.suffix && (
                        <span className="text-xs text-muted-foreground">{f.suffix}</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={config[f.key] === 0 ? "" : config[f.key]}
                      onChange={(e) => update(f.key, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {idx < GROUPS.length - 1 && <Separator className="mt-6" />}
            </section>
          ))}
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>What the current settings produce for sample event sizes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PreviewCard guests={50} total={preview50} />
            <PreviewCard guests={100} total={preview100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewCard({ guests, total }: { guests: number; total: number }) {
  return (
    <div className="rounded-md border bg-muted p-4">
      <div className="text-sm text-muted-foreground">{guests}-guest event</div>
      <div className="text-2xl font-bold mt-1">{fmt(total)}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {fmt(total / guests)} per person
      </div>
    </div>
  );
}
