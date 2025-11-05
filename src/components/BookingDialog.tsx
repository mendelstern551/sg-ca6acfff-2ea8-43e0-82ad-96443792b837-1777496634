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
import { Booking, BookingType, Payment, PaymentStatus, DEFAULT_PRICING, MappedBooking } from "@/types/booking";
import { calculateRates, formatCurrency } from "@/lib/bookingCalculations";
import { Card, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: Omit<MappedBooking, "id" | "createdAt" | "updatedAt">) => void;
  booking?: MappedBooking;
  bookings: MappedBooking[];
}

export function BookingDialog({ open, onOpenChange, onSave, booking: editingBooking, bookings }: BookingDialogProps) {
  const [bookingType, setBookingType] = useState<BookingType>("shabaton");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numberOfGuests, setNumberOfGuests] = useState<number | "">("");
  const [numberOfRooms, setNumberOfRooms] = useState<number | "">("");
  const [baseRate, setBaseRate] = useState<number | "">("");
  const [perPersonRate, setPerPersonRate] = useState<number | "">("");
  const [cleaningFee, setCleaningFee] = useState<number | "">("");
  const [additionalCleaningFee, setAdditionalCleaningFee] = useState<number | "">("");
  const [totalCost, setTotalCost] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  const [pricingConfig] = useState(DEFAULT_PRICING);

  useEffect(() => {
    if (editingBooking) {
      setBookingType(editingBooking.bookingType);
      setName(editingBooking.name);
      setContactName(editingBooking.contactName);
      setContactEmail(editingBooking.contactEmail || "");
      setContactPhone(editingBooking.contactPhone || "");
      setDateRange({ from: new Date(editingBooking.startDate), to: new Date(editingBooking.endDate) });
      setNumberOfGuests(editingBooking.numberOfGuests);
      setNumberOfRooms(editingBooking.numberOfRooms);
      setBaseRate(editingBooking.baseRate);
      setPerPersonRate(editingBooking.perPersonRate);
      setCleaningFee(editingBooking.cleaningFee);
      setAdditionalCleaningFee(editingBooking.additionalCleaningFee);
      setTotalCost(editingBooking.totalCost);
      setDepositAmount(editingBooking.depositAmount);
      setConfirmed(editingBooking.confirmed);
      setCustomPrice(editingBooking.customPrice);
      setDiscountPercent(editingBooking.discountPercent);
      setNotes(editingBooking.notes || "");
      setPayments(editingBooking.payments || []);
    } else {
      resetForm();
    }
  }, [editingBooking, open]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetForm();
      }, 300);
    } else {
      recalculateRates();
    }
  }, [open]);

  const resetForm = () => {
    setBookingType("shabaton");
    setName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setDateRange(undefined);
    setNumberOfGuests("");
    setNumberOfRooms(1);
    setBaseRate("");
    setPerPersonRate("");
    setCleaningFee("");
    setAdditionalCleaningFee("");
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
    const rates = calculateRates(bookingType, guests, pricingConfig);

    if (customPrice === null) {
      setBaseRate(rates.baseRate);
      setPerPersonRate(rates.perPersonRate);
      setCleaningFee(rates.cleaningFee);
      setAdditionalCleaningFee(rates.additionalCleaningFee);
      let calculatedTotal = rates.totalCost;
      if (discountPercent !== null && discountPercent > 0) {
        calculatedTotal *= (1 - discountPercent / 100);
      }
      setTotalCost(calculatedTotal);
      setDepositAmount(calculatedTotal * (pricingConfig.depositPercentageFirst / 100));
    } else {
      setTotalCost(customPrice);
      setDepositAmount(customPrice * (pricingConfig.depositPercentageFirst / 100));
    }
  };

  useEffect(recalculateRates, [bookingType, numberOfGuests, customPrice, discountPercent]);

  const handleSave = () => {
    if (!contactName || !dateRange?.from || !dateRange?.to || numberOfGuests === "") return;

    const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = totalCost - amountPaid;

    const bookingData: Omit<MappedBooking, "id" | "createdAt" | "updatedAt"> = {
      name: name || `${contactName}'s ${bookingType.replace("_", " ")}`,
      bookingType: bookingType,
      contactName: contactName,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      numberOfGuests: Number(numberOfGuests),
      numberOfRooms: Number(numberOfRooms || 1),
      baseRate: Number(baseRate),
      perPersonRate: Number(perPersonRate),
      cleaningFee: Number(cleaningFee),
      additionalCleaningFee: Number(additionalCleaningFee),
      totalCost: totalCost,
      depositAmount: depositAmount,
      amountPaid: amountPaid,
      balanceDue: balanceDue,
      paymentStatus: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
      confirmed: confirmed,
      customPrice: customPrice,
      discountPercent: discountPercent,
      notes: notes,
      payments: payments,
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
                <Select
                  value={bookingType}
                  onValueChange={(value) => setBookingType(value as BookingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yom_tov">Yom Tov</SelectItem>
                    <SelectItem value="shabaton">Shabaton</SelectItem>
                    <SelectItem value="night_event">Night Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="confirmed"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(Boolean(checked))}
                />
                <Label
                  htmlFor="confirmed"
                  className="text-sm font-semibold cursor-pointer flex items-center gap-2"
                >
                  <span className="text-blue-700 dark:text-blue-300">
                    ✓ Booking Confirmed
                  </span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    (Check to mark as confirmed)
                  </span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Pesach 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Primary contact person"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Dates *</Label>
                <p className="text-xs text-slate-500 mb-2">
                  Click a start date, then click or drag to an end date to select your booking period
                </p>
                <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
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
                <Label htmlFor="numberOfGuests">Number of Guests</Label>
                <Input
                  id="numberOfGuests"
                  type="number"
                  min="0"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                <Input
                  id="numberOfRooms"
                  type="number"
                  min="1"
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(parseInt(e.target.value) || 1)}
                  placeholder="1"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-blue-600 font-semibold">Pricing Adjustments</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountType" className="text-sm">Discount Type</Label>
                    <Select
                      value={discountPercent > 0 ? "percentage" : "fixed"}
                      onValueChange={(value) => setDiscountPercent(value === "percentage" ? 0 : 100)}
                    >
                      <SelectTrigger id="discountType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountAmount" className="text-sm">Discount Value</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      step={discountPercent > 0 ? "1" : "0.01"}
                      max={discountPercent > 0 ? "100" : undefined}
                      value={discountPercent || ""}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      placeholder={discountPercent > 0 ? "0-100" : "0.00"}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="customPrice" className="text-sm flex items-center gap-2">
                    Custom Price Override
                    <span className="text-xs font-normal text-slate-500">(Leave empty to use calculated price)</span>
                  </Label>
                  <Input
                    id="customPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice || ""}
                    onChange={(e) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Enter custom total price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or special requirements"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Pricing Breakdown</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Base Rate</p>
                  <p className="text-lg font-semibold">{formatCurrency(baseRate)}</p>
                </div>
                {bookingType !== "night_event" && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Per Person ({numberOfGuests} guests)</p>
                      <p className="text-lg font-semibold">{formatCurrency(perPersonRate)}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cleaning Fee</p>
                  <p className="text-lg font-semibold">{formatCurrency(cleaningFee)}</p>
                </div>
                {additionalCleaningFee > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Additional Cleaning</p>
                    <p className="text-lg font-semibold">{formatCurrency(additionalCleaningFee)}</p>
                  </div>
                )}
                <div className="col-span-2 pt-4 border-t">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Subtotal</p>
                  <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
                </div>

                {(customPrice !== null && customPrice > 0 || discountPercent > 0) && (
                  <>
                    {customPrice !== null && customPrice > 0 ? (
                      <div className="col-span-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold">Custom Price Applied</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(customPrice)}</p>
                      </div>
                    ) : discountPercent > 0 ? (
                      <>
                        <div className="col-span-2 bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Discount: {discountPercent}%
                          </p>
                          <p className="text-lg font-semibold text-orange-600">
                            -{formatCurrency(totalCost - (totalCost * (1 - discountPercent / 100))}
                          </p>
                        </div>
                      </>
                    ) : null}

                    <div className="col-span-2 pt-2 border-t-2 border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Final Total</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                    </div>
                  </>
                )}

                {!customPrice && discountPercent === 0 && (
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">1st Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(depositAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">2nd Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(depositAmount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Balance Due (50%)</p>
                  <p className="font-semibold">{formatCurrency(totalCost - depositAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingBooking ? "Update Booking" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
