import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator, Mail, AlertTriangle, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Booking, BookingType, Payment, DEFAULT_PRICING, PricingConfig } from "@/types/booking";
import { formatCurrency, calculateBookingCost } from "@/lib/bookingCalculations";
import { usePricingConfig } from "@/lib/pricingStore";
import { DEFAULT_EVENT_MARGIN_CONFIG, type EventMarginConfig, allocateBuildingsForGuests } from "@/types/eventMargin";
import { useAppSetting } from "@/lib/settingsStore";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { emailService } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";
import { conflictDetectionService } from "@/services/conflictDetectionService";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BookingInsert = Omit<Booking, "id" | "created_at" | "updated_at" | "payments">;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: BookingInsert) => void;
  booking?: Booking;
  bookings: Booking[];
}

export function BookingDialog({ open, onOpenChange, onSave, booking: editingBooking, bookings }: BookingDialogProps) {
  const [bookingType, setBookingType] = useState<BookingType>("shabaton");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfGuests, setNumberOfGuests] = useState<number | "">("");
  const [baseRate, setBaseRate] = useState<number>(0);
  const [perPersonRate, setPerPersonRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [additionalCleaningFee, setAdditionalCleaningFee] = useState<number>(0);
  const [totalCost, setTotalCost] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  // ✅ NEW: Conflict detection state
  const [dateConflict, setDateConflict] = useState<{ hasConflict: boolean; message?: string }>({ hasConflict: false });
  const [capacityWarning, setCapacityWarning] = useState<{ hasWarning: boolean; message?: string }>({ hasWarning: false });

  // Wizard step state. The form is split into four screens; user moves
  // through them with Back/Next so each screen has just one logical
  // chunk (basics → contact → dates+guests → pricing+notes). Validation
  // runs per-step so the user can't move forward leaving required
  // fields blank. When editing an existing booking we still start at
  // step 1 but every step's fields are pre-filled — users can click
  // the step pills above to jump anywhere directly.
  const TOTAL_STEPS = 4;
  const [step, setStep] = useState<number>(1);

  // Live pricing from Settings → Pricing tab. Updates without a refresh when admin saves.
  const pricingConfig = usePricingConfig();
  // Live cost model from Event Margin tab. Drives the "Expected Expenses" preview below.
  const marginConfig = useAppSetting<EventMarginConfig>("event-margin", DEFAULT_EVENT_MARGIN_CONFIG);
  const { toast } = useToast();

  useEffect(() => {
    if (editingBooking) {
      setBookingType(editingBooking.booking_type as BookingType);
      setName(editingBooking.name);
      setContactName(editingBooking.contact_name);
      setContactEmail(editingBooking.contact_email || "");
      setContactPhone(editingBooking.contact_phone || "");
      setDateRange({ from: new Date(editingBooking.start_date), to: new Date(editingBooking.end_date) });
      setNumberOfGuests(editingBooking.number_of_guests);
      setBaseRate(editingBooking.base_rate);
      setPerPersonRate(editingBooking.per_person_rate);
      setCleaningFee(editingBooking.cleaning_fee);
      setAdditionalCleaningFee(editingBooking.additional_cleaning_fee);
      setTotalCost(editingBooking.total_cost);
      setDepositAmount(editingBooking.deposit_amount);
      setConfirmed(editingBooking.confirmed);
      setCustomPrice(editingBooking.custom_price);
      setDiscountPercent(editingBooking.discount_percent);
      setNotes(editingBooking.notes || "");
      setPayments(editingBooking.payments || []);
    } else {
      resetForm();
    }
  }, [editingBooking, open]);
  
  useEffect(() => {
    if (!open) {
      setTimeout(() => resetForm(), 300);
    } else {
      // Always restart the wizard at step 1 when reopening.
      setStep(1);
      if (!editingBooking) recalculateRates();
    }
  }, [open, editingBooking]);

  // Per-step validity. The user can't tap "Next" without filling the
  // required fields on the current step. Step 4 has no required-field
  // gating — Save runs the same checks `handleSave` already does.
  const stepValid = (s: number): boolean => {
    if (s === 1) return !!bookingType && name.trim().length > 0;
    if (s === 2) return contactName.trim().length > 0;
    if (s === 3) return !!dateRange?.from && !!dateRange?.to && typeof numberOfGuests === "number" && numberOfGuests > 0;
    return true;
  };
  const canAdvance = stepValid(step);
  const goNext = () => {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };
  const stepLabels = ["Basics", "Contact", "Dates & Guests", "Pricing"];

  const resetForm = () => {
    setBookingType("shabaton");
    setName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setDateRange(undefined);
    setNumberOfGuests("");
    setBaseRate(0);
    setPerPersonRate(0);
    setCleaningFee(0);
    setAdditionalCleaningFee(0);
    setTotalCost(0);
    setDepositAmount(0);
    setConfirmed(false);
    setSendConfirmationEmail(false);
    setCustomPrice(null);
    setDiscountPercent(null);
    setNotes("");
    setPayments([]);
  };

  const recalculateRates = () => {
    const guests = typeof numberOfGuests === 'number' ? numberOfGuests : 0;
    const rates = calculateBookingCost(bookingType, guests, pricingConfig);

    setBaseRate(rates.baseRate);
    setPerPersonRate(rates.perPersonRate);
    setCleaningFee(rates.cleaningFee);
    setAdditionalCleaningFee(rates.additionalCleaningFee);

    let finalTotal = customPrice !== null ? customPrice : rates.totalCost;
    if (discountPercent !== null && discountPercent > 0) {
      finalTotal *= (1 - discountPercent / 100);
    }

    setTotalCost(finalTotal);
    setDepositAmount(finalTotal * (pricingConfig.depositPercentageFirst / 100));
  };
  
  useEffect(recalculateRates, [bookingType, numberOfGuests, customPrice, discountPercent, pricingConfig]);

  // ✅ NEW: Conflict detection when dates or guests change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      // Check for date conflicts
      const conflict = conflictDetectionService.checkDateConflict(
        dateRange.from.toISOString(),
        dateRange.to.toISOString(),
        bookings,
        editingBooking?.id // Exclude current booking if editing
      );
      setDateConflict(conflict);

      // Check for capacity warnings
      if (typeof numberOfGuests === 'number' && numberOfGuests > 0) {
        const capacityCheck = conflictDetectionService.checkCapacityWarning(
          numberOfGuests,
          dateRange.from.toISOString(),
          dateRange.to.toISOString(),
          bookings,
          editingBooking?.id
        );
        setCapacityWarning(capacityCheck);
      }
    } else {
      setDateConflict({ hasConflict: false });
      setCapacityWarning({ hasWarning: false });
    }
  }, [dateRange, numberOfGuests, bookings, editingBooking?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Wizard guard: pressing Enter on an earlier step should advance, not
    // submit. Save only fires from the final step's "Create / Update" button.
    if (step < TOTAL_STEPS) {
      goNext();
      return;
    }
    if (!contactName || !dateRange?.from || !dateRange?.to || numberOfGuests === "") return;

    // ✅ NEW: Warn about conflicts before saving
    if (dateConflict.hasConflict) {
      const proceed = window.confirm(
        `⚠️ WARNING: ${dateConflict.message}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    if (capacityWarning.hasWarning) {
      const proceed = window.confirm(
        `⚠️ WARNING: ${capacityWarning.message}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = totalCost - amountPaid;

    const bookingData: BookingInsert = {
      name: name || `${contactName}'s ${bookingType.replace("_", " ")}`,
      booking_type: bookingType,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      start_date: dateRange.from.toISOString(),
      end_date: dateRange.to.toISOString(),
      number_of_guests: Number(numberOfGuests),
      number_of_rooms: 1,
      base_rate: baseRate,
      per_person_rate: perPersonRate,
      cleaning_fee: cleaningFee,
      additional_cleaning_fee: additionalCleaningFee,
      total_cost: totalCost,
      deposit_amount: depositAmount,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      payment_status: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
      confirmed: confirmed,
      custom_price: customPrice,
      discount_percent: discountPercent,
      notes: notes,
      building_id: null,
      recurring: false
    };
    
    onSave(bookingData);
    onOpenChange(false);

    // Send confirmation email if checkbox was checked and booking is confirmed
    if (confirmed && sendConfirmationEmail && contactEmail) {
      try {
        const fullBookingData: Booking = {
          ...bookingData,
          id: editingBooking?.id || "temp-id",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payments: []
        };
        
        const result = await emailService.sendBookingConfirmation(fullBookingData);
        
        if (result.success) {
          toast({
            title: "Confirmation Email Sent! ✓",
            description: `Booking confirmation sent to ${contactEmail}`,
          });
        } else {
          toast({
            title: "Email Not Sent",
            description: result.error || "Failed to send confirmation email",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error sending confirmation email:", error);
      }
    } else if (confirmed && sendConfirmationEmail && !contactEmail) {
      toast({
        title: "No Email Address",
        description: "Please provide a client email address to send confirmation",
        variant: "destructive"
      });
    }
  };
  
  const handleBookingTypeChange = (value: string) => {
    if (value === "yom_tov" || value === "shabaton" || value === "night_event") {
      setBookingType(value as BookingType);
    }
  };

  const handleConfirmedChange = (checked: boolean | string) => {
    setConfirmed(Boolean(checked));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-5xl gives the 2-month calendar on step 3 enough horizontal
          room to render side-by-side without clipping. Other steps still
          read fine at this width — fields are full-width or 2-col. */}
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
          <DialogDescription>
            Step {step} of {TOTAL_STEPS}: {stepLabels[step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator — clickable pills so users can jump back to any
            previous step. We don't let them skip FORWARD past an invalid
            step (the next-pill is disabled until the current step is OK)
            so required fields don't get left blank. */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4 pb-3 border-b">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const isCurrent = num === step;
            const isComplete = num < step && stepValid(num);
            const isReachable = num <= step || stepValid(step);
            return (
              <button
                key={label}
                type="button"
                disabled={!isReachable && num > step}
                onClick={() => { if (num < step || (num > step && stepValid(step))) setStep(num); }}
                className={`flex-1 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-left
                  ${isCurrent ? "bg-blue-600 text-white" : ""}
                  ${!isCurrent && isComplete ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 cursor-pointer" : ""}
                  ${!isCurrent && !isComplete ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : ""}
                  ${!isReachable && num > step ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <span className={`flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs font-semibold shrink-0
                  ${isCurrent ? "bg-white text-blue-600" : ""}
                  ${!isCurrent && isComplete ? "bg-emerald-600 text-white" : ""}
                  ${!isCurrent && !isComplete ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" : ""}
                `}>
                  {isComplete ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : num}
                </span>
                <span className="text-xs sm:text-sm font-medium truncate hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* === STEP 1 — Booking basics === */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Booking Type *</Label>
                <Select value={bookingType} onValueChange={handleBookingTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select booking type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yom_tov">Yom Tov</SelectItem>
                    <SelectItem value="shabaton">Shabaton</SelectItem>
                    <SelectItem value="night_event">Night Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pesach 2025" required />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Checkbox id="confirmed" checked={confirmed} onCheckedChange={handleConfirmedChange} />
                <Label htmlFor="confirmed" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300">✓ Booking Confirmed</span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">(Check to mark as confirmed)</span>
                </Label>
              </div>
            </div>
          )}

          {/* === STEP 2 — Client contact info === */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Primary contact person" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>

              {confirmed && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <Checkbox
                    id="sendConfirmation"
                    checked={sendConfirmationEmail}
                    onCheckedChange={(checked) => setSendConfirmationEmail(Boolean(checked))}
                    disabled={!contactEmail}
                  />
                  <Label htmlFor="sendConfirmation" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">Send Confirmation Email</span>
                    {!contactEmail && (
                      <span className="text-xs font-normal text-orange-600 dark:text-orange-400">(Email required)</span>
                    )}
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* === STEP 3 — Dates + guests + conflict/capacity warnings === */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Dates *</Label>
                <div className="border rounded-lg p-2 bg-white dark:bg-slate-900 overflow-x-auto">
                  {/* Two months side-by-side on tablet/desktop so users
                      can pick date ranges that cross a month boundary
                      without paging back and forth. Falls back to a
                      stacked single column on phones. */}
                  <EnhancedCalendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                </div>
                {dateRange?.from && dateRange?.to && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Selected: {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        ({differenceInDays(dateRange.to, dateRange.from)} nights)
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                <Input id="numberOfGuests" type="number" min="1" value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Enter number of guests" required />
              </div>

              {dateConflict.hasConflict && (
                <Alert variant="destructive" className="border-2 border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">
                    {dateConflict.message}
                  </AlertDescription>
                </Alert>
              )}

              {capacityWarning.hasWarning && (
                <Alert className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="font-semibold text-amber-800 dark:text-amber-200">
                    {capacityWarning.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* === STEP 4 — Pricing breakdown + adjustments + notes + expected profit === */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2 pt-2">
                <Label className="text-blue-600 font-semibold">Pricing Adjustments</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent" className="text-sm">Discount (%)</Label>
                    <Input id="discountPercent" type="number" min="0" max="100" value={discountPercent ?? ""} onChange={(e) => setDiscountPercent(e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="e.g., 10 for 10%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customPrice" className="text-sm">Custom Price ($)</Label>
                    <Input id="customPrice" type="number" min="0" step="0.01" value={customPrice ?? ""} onChange={(e) => setCustomPrice(e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="Override total price" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes or special requirements" rows={4} />
              </div>
            </div>
          )}

          {step === 4 && (
          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Pricing Breakdown</h3>
              </div>
              <div className="space-y-3">
                {bookingType !== "night_event" && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Per person · {Number(numberOfGuests) || 0} guest{Number(numberOfGuests) === 1 ? "" : "s"} × {formatCurrency(perPersonRate)}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(perPersonRate * (Number(numberOfGuests) || 0))}
                    </span>
                  </div>
                )}
                {discountPercent !== null && discountPercent > 0 && (
                  <div className="flex justify-between items-baseline text-orange-700 dark:text-orange-300">
                    <span className="text-sm">Discount applied</span>
                    <span className="font-medium">−{discountPercent}%</span>
                  </div>
                )}
                {customPrice !== null && (
                  <div className="flex justify-between items-baseline text-emerald-700 dark:text-emerald-300">
                    <span className="text-sm">Custom price override</span>
                    <span className="font-medium">{formatCurrency(customPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Cost</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-slate-500">1st Deposit ({pricingConfig.depositPercentageFirst}%)</p>
                    <p className="font-semibold">{formatCurrency(depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Balance Due</p>
                    <p className="font-semibold">{formatCurrency(totalCost - depositAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Expected Expenses & Profit — auto-calculated from Event Margin config.
              Updates live as the user types guests / picks a custom price, BEFORE saving.
              Only shown on the final review step. */}
          {step === 4 && (() => {
            const guestsNum = typeof numberOfGuests === "number" ? numberOfGuests : 0;
            if (guestsNum <= 0 && totalCost <= 0) return null;
            const allocated = allocateBuildingsForGuests(guestsNum, marginConfig.buildings);
            const buildingCleaning = allocated.reduce((s, b) => s + (Number(b.cleaningFee) || 0), 0);
            const perEventLines = (marginConfig.perEventExpenses || []).reduce(
              (s, e) => s + (Number(e.amount) || 0),
              0
            );
            const commission = Math.max(
              totalCost * (marginConfig.manager.commissionPercent / 100),
              marginConfig.manager.minimumCommissionPerEvent
            );
            const expectedExpenses = commission + buildingCleaning + perEventLines;
            const projectedProfit = totalCost - expectedExpenses;
            const margin = totalCost > 0 ? (projectedProfit / totalCost) * 100 : 0;
            const profitPerGuest = guestsNum > 0 ? projectedProfit / guestsNum : 0;
            const totalBeds = marginConfig.buildings.reduce((s, b) => s + (Number(b.beds) || 0), 0);
            const overCapacity = guestsNum > totalBeds;
            return (
              <Card className={
                projectedProfit >= 0
                  ? "border-2 border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900"
                  : "border-2 border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900"
              }>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {projectedProfit >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-rose-600" />
                      )}
                      <h3 className="font-semibold">Expected Expenses & Profit</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Live preview · based on Event Margin config
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expense breakdown */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Manager commission ({marginConfig.manager.commissionPercent}% / min {formatCurrency(marginConfig.manager.minimumCommissionPerEvent)})
                        </span>
                        <span className="font-medium">{formatCurrency(commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Building cleaning · {allocated.length}× ({allocated.map(b => b.name).join(", ") || "—"})
                        </span>
                        <span className="font-medium">{formatCurrency(buildingCleaning)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Per-event line items ({marginConfig.perEventExpenses.length})
                        </span>
                        <span className="font-medium">{formatCurrency(perEventLines)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Total expected expenses</span>
                        <span className="font-bold text-rose-600">{formatCurrency(expectedExpenses)}</span>
                      </div>
                    </div>

                    {/* Profit summary */}
                    <div className="rounded-lg bg-white dark:bg-slate-900 border p-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Revenue</span>
                        <span className="text-lg font-semibold">{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Net profit</span>
                        <span className={
                          "text-2xl font-bold " +
                          (projectedProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")
                        }>
                          {formatCurrency(projectedProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Margin</span>
                        <span className={
                          "text-sm font-medium " +
                          (projectedProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")
                        }>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                      {guestsNum > 0 && (
                        <div className="flex justify-between items-baseline border-t pt-2">
                          <span className="text-xs text-slate-500">Profit per guest</span>
                          <span className="text-sm font-medium">{formatCurrency(profitPerGuest)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {overCapacity && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-3">
                      ⚠ {guestsNum} guests exceed total bed capacity ({totalBeds}).
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-4 border-t">
            <div>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={step === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance}
                  title={!canAdvance ? "Fill in the required fields above first" : undefined}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit">
                  {editingBooking ? "Update Booking" : "Create Booking"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
