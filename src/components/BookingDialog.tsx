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
import { format } from "date-fns";
import { Booking, BookingType } from "@/types/booking";
import { calculateBookingCost, formatCurrency } from "@/lib/bookingCalculations";
import { Card, CardContent } from "@/components/ui/card";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: Booking) => void;
  booking?: Booking;
}

export function BookingDialog({ open, onOpenChange, onSave, booking }: BookingDialogProps) {
  const [formData, setFormData] = useState({
    type: "yom_tov" as BookingType,
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    numberOfGuests: 0,
    notes: "",
    confirmed: false,
    discountAmount: 0,
    discountType: "percentage" as "percentage" | "fixed",
    customPrice: undefined as number | undefined,
  });

  const [calculations, setCalculations] = useState(calculateBookingCost("yom_tov", 0));
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    if (booking) {
      setFormData({
        type: booking.type,
        name: booking.name,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        startDate: new Date(booking.startDate),
        endDate: new Date(booking.endDate),
        numberOfGuests: booking.numberOfGuests,
        notes: booking.notes,
        confirmed: booking.confirmed,
        discountAmount: 0,
        discountType: "percentage",
        customPrice: undefined,
      });
    }
  }, [booking]);

  useEffect(() => {
    const calc = calculateBookingCost(formData.type, formData.numberOfGuests);
    setCalculations(calc);

    let calculatedPrice = calc.totalCost;

    if (formData.customPrice !== undefined && formData.customPrice > 0) {
      calculatedPrice = formData.customPrice;
    } else if (formData.discountAmount > 0) {
      if (formData.discountType === "percentage") {
        const discountPercent = Math.min(formData.discountAmount, 100);
        calculatedPrice = calc.totalCost * (1 - discountPercent / 100);
      } else {
        calculatedPrice = Math.max(0, calc.totalCost - formData.discountAmount);
      }
    }

    setFinalPrice(calculatedPrice);
  }, [formData.type, formData.numberOfGuests, formData.discountAmount, formData.discountType, formData.customPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      alert("Please select start and end dates");
      return;
    }

    // Check for overlapping bookings (double-booking prevention)
    const existingBookings = JSON.parse(localStorage.getItem("trout-lake-bookings") || "[]") as Booking[];
    const currentBookingId = booking?.id;
    
    const hasConflict = existingBookings.some((existingBooking) => {
      // Skip checking against the current booking being edited
      if (currentBookingId && existingBooking.id === currentBookingId) {
        return false;
      }

      const existingStart = new Date(existingBooking.startDate);
      const existingEnd = new Date(existingBooking.endDate);
      const newStart = formData.startDate!;
      const newEnd = formData.endDate!;

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

    const actualTotalCost = formData.customPrice !== undefined && formData.customPrice > 0 
      ? formData.customPrice 
      : finalPrice;

    const newBooking: Booking = {
      id: booking?.id || `booking-${Date.now()}`,
      type: formData.type,
      name: formData.name,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      numberOfGuests: formData.numberOfGuests,
      baseRate: calculations.baseRate,
      perPersonRate: calculations.perPersonRate,
      cleaningFee: calculations.cleaningFee,
      additionalCleaningFee: calculations.additionalCleaningFee,
      totalCost: actualTotalCost,
      depositAmount: actualTotalCost * 0.5,
      amountPaid: booking?.amountPaid || 0,
      balanceDue: actualTotalCost - (booking?.amountPaid || 0),
      paymentStatus: booking?.paymentStatus || "pending",
      confirmed: formData.confirmed,
      notes: formData.notes,
      createdAt: booking?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newBooking);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: "yom_tov",
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      startDate: undefined,
      endDate: undefined,
      numberOfGuests: 0,
      notes: "",
      confirmed: false,
      discountAmount: 0,
      discountType: "percentage",
      customPrice: undefined,
    });
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
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as BookingType })}
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
                  checked={formData.confirmed}
                  onCheckedChange={(checked) => setFormData({ ...formData, confirmed: checked === true })}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pesach 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Primary contact person"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EnhancedCalendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EnhancedCalendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfGuests">Number of Guests</Label>
                <Input
                  id="numberOfGuests"
                  type="number"
                  min="0"
                  value={formData.numberOfGuests}
                  onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-blue-600 font-semibold">Pricing Adjustments</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountType" className="text-sm">Discount Type</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) => setFormData({ ...formData, discountType: value as "percentage" | "fixed" })}
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
                      step={formData.discountType === "percentage" ? "1" : "0.01"}
                      max={formData.discountType === "percentage" ? "100" : undefined}
                      value={formData.discountAmount || ""}
                      onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                      placeholder={formData.discountType === "percentage" ? "0-100" : "0.00"}
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
                    value={formData.customPrice || ""}
                    onChange={(e) => setFormData({ ...formData, customPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Enter custom total price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                {formData.type !== "night_event" && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Per Person ({formData.numberOfGuests} guests)</p>
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

                {(formData.discountAmount > 0 || formData.customPrice) && (
                  <>
                    {formData.customPrice !== undefined && formData.customPrice > 0 ? (
                      <div className="col-span-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold">Custom Price Applied</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(formData.customPrice)}</p>
                      </div>
                    ) : formData.discountAmount > 0 ? (
                      <>
                        <div className="col-span-2 bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Discount: {formData.discountType === "percentage" 
                              ? `${formData.discountAmount}%` 
                              : formatCurrency(formData.discountAmount)}
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

                {!formData.customPrice && formData.discountAmount === 0 && (
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
