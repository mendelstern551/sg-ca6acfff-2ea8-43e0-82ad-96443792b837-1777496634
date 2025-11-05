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
import { CalendarIcon, Calculator } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Booking, BookingType, Payment, DEFAULT_PRICING, PricingConfig } from "@/types/booking";
import { formatCurrency, calculateBookingCost } from "@/lib/bookingCalculations";
import { Card, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";

type BookingInsert = Omit<Booking, "id" | "created_at" | "updated_at" | "payments">;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: BookingInsert) => void;
  booking?: Booking;
  bookings: Booking[];
}

export function BookingDialog({ open, onOpenChange, onSave, booking: editingBooking }: BookingDialogProps) {
  const [bookingType, setBookingType] = useState<BookingType>("shabaton");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfGuests, setNumberOfGuests] = useState<number | "">("");
  const [numberOfRooms, setNumberOfRooms] = useState<number | "">(1);
  const [baseRate, setBaseRate] = useState<number>(0);
  const [perPersonRate, setPerPersonRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [additionalCleaningFee, setAdditionalCleaningFee] = useState<number>(0);
  const [totalCost, setTotalCost] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [pricingConfig] = useState<PricingConfig>(DEFAULT_PRICING);

  useEffect(() => {
    if (editingBooking) {
      setBookingType(editingBooking.booking_type);
      setName(editingBooking.name);
      setContactName(editingBooking.contact_name);
      setContactEmail(editingBooking.contact_email || "");
      setContactPhone(editingBooking.contact_phone || "");
      setDateRange({ from: new Date(editingBooking.start_date), to: new Date(editingBooking.end_date) });
      setNumberOfGuests(editingBooking.number_of_guests);
      setNumberOfRooms(editingBooking.number_of_rooms || 1);
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
    setNumberOfRooms(1);
    setBaseRate(0);
    setPerPersonRate(0);
    setCleaningFee(0);
    setAdditionalCleaningFee(0);
    setTotalCost(0);
    setDepositAmount(0);
    setConfirmed(false);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !dateRange?.from || !dateRange?.to || numberOfGuests === "") return;

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
      number_of_rooms: Number(numberOfRooms || 1),
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
    };
    onSave(bookingData);
    onOpenChange(false);
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
                <Select value={bookingType} onValueChange={(value) => setBookingType(value as BookingType)}>
                  <SelectTrigger><SelectValue placeholder="Select booking type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yom_tov">Yom Tov</SelectItem>
                    <SelectItem value="shabaton">Shabaton</SelectItem>
                    <SelectItem value="night_event">Night Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Checkbox id="confirmed" checked={confirmed} onCheckedChange={(checked) => setConfirmed(Boolean(checked))} />
                <Label htmlFor="confirmed" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <span className="text-blue-700 dark:text-blue-300">✓ Booking Confirmed</span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">(Check to mark as confirmed)</span>
                </Label>
              </div>

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
                <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
                  <EnhancedCalendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="rounded-md" />
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
                <Input id="numberOfGuests" type="number" min="0" value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                <Input id="numberOfRooms" type="number" min="1" value={numberOfRooms} onChange={(e) => setNumberOfRooms(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="1" />
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
