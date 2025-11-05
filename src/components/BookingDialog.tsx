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
import { Booking, BookingType } from "@/types/booking";
import { calculateBookingCost, formatCurrency } from "@/lib/bookingCalculations";
import { Card, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: Booking) => void;
  booking?: Booking;
  bookings: Booking[];
}

export function BookingDialog({ open, onOpenChange, onSave, booking, bookings }: BookingDialogProps) {
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<BookingType>("yom_tov");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [numberOfGuests, setNumberOfGuests] = useState(50);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [notes, setNotes] = useState("");
  const [customPrice, setCustomPrice] = useState<number | undefined>();
  const [discountPercent, setDiscountPercent] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const [calculations, setCalculations] = useState(calculateBookingCost("yom_tov", 0));
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    if (booking) {
      setStep(1);
      setBookingType(booking.bookingType);
      setName(booking.name);
      setContactName(booking.contactName);
      setContactEmail(booking.contactEmail);
      setContactPhone(booking.contactPhone);
      setDateRange({
        from: new Date(booking.startDate),
        to: new Date(booking.endDate),
      });
      setNumberOfGuests(booking.numberOfGuests);
      setNumberOfRooms(booking.numberOfRooms || 1);
      setNotes(booking.notes);
      setCustomPrice(booking.customPrice);
      setDiscountPercent(booking.discountPercent || 0);
      setConfirmed(booking.confirmed);
    } else {
      resetForm();
    }
  }, [booking, open]);

  useEffect(() => {
    const calc = calculateBookingCost(bookingType, numberOfGuests);
    setCalculations(calc);

    let calculatedPrice = calc.totalCost;

    if (customPrice !== undefined && customPrice > 0) {
      calculatedPrice = customPrice;
    } else if (discountPercent > 0) {
      const discountAmount = (calc.totalCost * discountPercent) / 100;
      calculatedPrice = Math.max(0, calc.totalCost - discountAmount);
    }

    setFinalPrice(calculatedPrice);
  }, [bookingType, numberOfGuests, customPrice, discountPercent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select start and end dates");
      return;
    }

    // Check for overlapping bookings (double-booking prevention)
    const currentBookingId = booking?.id;
    
    const hasConflict = bookings.some((existingBooking) => {
      // Skip checking against the current booking being edited
      if (currentBookingId && existingBooking.id === currentBookingId) {
        return false;
      }

      const existingStart = new Date(existingBooking.startDate);
      const existingEnd = new Date(existingBooking.endDate);
      const newStart = dateRange.from!;
      const newEnd = dateRange.to!;

      // Check if dates overlap
      return (
        (newStart >= existingStart && newStart <= existingEnd) ||
        (newEnd >= existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      alert("⚠️ Double Booking Conflict!\n\nThese dates overlap with an existing booking. Please choose different dates or check the calendar for availability.");
      return;
    }

    const newBooking: Booking = {
      id: booking?.id || `booking-${Date.now()}`,
      bookingType,
      name,
      contactName,
      contactEmail,
      contactPhone,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      numberOfGuests,
      numberOfRooms,
      totalCost: finalPrice,
      depositAmount: finalPrice * 0.25, // Assuming 25% deposit
      amountPaid: booking?.amountPaid || 0,
      balanceDue: finalPrice - (booking?.amountPaid || 0),
      paymentStatus: "pending", // Default status
      confirmed,
      notes,
      createdAt: booking?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: booking?.payments || [],
      customPrice,
      discountPercent,
      ...calculations,
    };

    onSave(newBooking);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setBookingType("yom_tov");
    setName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setDateRange(undefined);
    setNumberOfGuests(50);
    setNumberOfRooms(1);
    setNotes("");
    setCustomPrice(undefined);
    setDiscountPercent(0);
    setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking" : "Create New Booking"}</DialogTitle>
          <DialogDescription>
            Fill in the booking details below. Pricing will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="text-lg font-semibold">{formatCurrency(calculations.baseRate)}</p>
                </div>
                {bookingType !== "night_event" && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Per Person ({numberOfGuests} guests)</p>
                      <p className="text-lg font-semibold">{formatCurrency(calculations.perPersonTotal)}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cleaning Fee</p>
                  <p className="text-lg font-semibold">{formatCurrency(calculations.cleaningFee)}</p>
                </div>
                {calculations.additionalCleaningFee > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Additional Cleaning</p>
                    <p className="text-lg font-semibold">{formatCurrency(calculations.additionalCleaningFee)}</p>
                  </div>
                )}
                <div className="col-span-2 pt-4 border-t">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Subtotal</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.totalCost)}</p>
                </div>

                {(customPrice !== undefined && customPrice > 0 || discountPercent > 0) && (
                  <>
                    {customPrice !== undefined && customPrice > 0 ? (
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
                            -{formatCurrency(calculations.totalCost - finalPrice)}
                          </p>
                        </div>
                      </>
                    ) : null}

                    <div className="col-span-2 pt-2 border-t-2 border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Final Total</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(finalPrice)}</p>
                    </div>
                  </>
                )}

                {!customPrice && discountPercent === 0 && (
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculations.totalCost)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">1st Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(finalPrice * 0.25)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">2nd Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(finalPrice * 0.25)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Balance Due (50%)</p>
                  <p className="font-semibold">{formatCurrency(finalPrice * 0.5)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {booking ? "Update Booking" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
