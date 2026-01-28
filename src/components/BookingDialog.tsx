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
import { CalendarIcon, Calculator, Mail, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Booking, BookingType, Payment, DEFAULT_PRICING, PricingConfig } from "@/types/booking";
import { formatCurrency, calculateBookingCost } from "@/lib/bookingCalculations";
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

  const [pricingConfig] = useState<PricingConfig>(DEFAULT_PRICING);
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
    } else if (!editingBooking) {
      recalculateRates();
    }
  }, [open, editingBooking]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
          <DialogDescription>
            Fill in the booking details below. Pricing will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Booking Type</Label>
                <Select value={bookingType} onValueChange={handleBookingTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select booking type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yom_tov">Yom Tov</SelectItem>
                    <SelectItem value="shabaton">Shabaton</SelectItem>
                    <SelectItem value="night_event">Night Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Checkbox id="confirmed" checked={confirmed} onCheckedChange={handleConfirmedChange} />
                <Label htmlFor="confirmed" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300">✓ Booking Confirmed</span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">(Check to mark as confirmed)</span>
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pesach 2025" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
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
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Dates *</Label>
                <div className="border rounded-lg p-2 bg-white dark:bg-slate-900">
                  <EnhancedCalendar 
                    mode="range" 
                    selected={dateRange} 
                    onSelect={setDateRange} 
                    numberOfMonths={1}
                    className="rounded-md scale-90"
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
                <Label htmlFor="numberOfGuests">Number of Guests</Label>
                <Input id="numberOfGuests" type="number" min="1" value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Enter number of guests" required />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-blue-600 font-semibold">Pricing Adjustments</Label>
                <div className="grid grid-cols-2 gap-2">
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
          </div>

          {/* ✅ NEW: Conflict and capacity warnings */}
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

          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4"><Calculator className="h-5 w-5 text-blue-600" /><h3 className="font-semibold">Pricing Breakdown</h3></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-sm text-slate-600 dark:text-slate-400">Base Rate</p><p className="text-lg font-semibold">{formatCurrency(baseRate)}</p></div>
                {bookingType !== "night_event" && (
                  <div><p className="text-sm text-slate-600 dark:text-slate-400">Per Person ({Number(numberOfGuests) || 0} guests)</p><p className="text-lg font-semibold">{formatCurrency(perPersonRate * (Number(numberOfGuests) || 0))}</p></div>
                )}
                <div><p className="text-sm text-slate-600 dark:text-slate-400">Cleaning Fee</p><p className="text-lg font-semibold">{formatCurrency(cleaningFee)}</p></div>
                {additionalCleaningFee > 0 && (
                  <div><p className="text-sm text-slate-600 dark:text-slate-400">Additional Cleaning</p><p className="text-lg font-semibold">{formatCurrency(additionalCleaningFee)}</p></div>
                )}
                {discountPercent !== null && discountPercent > 0 && (
                  <div className="col-span-full bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-300">Discount: {discountPercent}%</p>
                  </div>
                )}
                {customPrice !== null && (
                  <div className="col-span-full bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-semibold">Custom Price Applied</p>
                  </div>
                )}
                <div className="col-span-full pt-4 border-t mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
                <div className="col-span-2"><p className="text-sm text-slate-600 dark:text-slate-400">1st Deposit (25%)</p><p className="font-semibold">{formatCurrency(depositAmount)}</p></div>
                <div className="col-span-2"><p className="text-sm text-slate-600 dark:text-slate-400">Balance Due</p><p className="font-semibold">{formatCurrency(totalCost - depositAmount)}</p></div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingBooking ? "Update Booking" : "Create Booking"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
