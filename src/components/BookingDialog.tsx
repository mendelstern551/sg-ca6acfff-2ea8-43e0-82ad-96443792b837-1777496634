import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
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
  });

  const [calculations, setCalculations] = useState(calculateBookingCost("yom_tov", 0));

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
      });
    }
  }, [booking]);

  useEffect(() => {
    const calc = calculateBookingCost(formData.type, formData.numberOfGuests);
    setCalculations(calc);
  }, [formData.type, formData.numberOfGuests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      alert("Please select start and end dates");
      return;
    }

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
      totalCost: calculations.totalCost,
      depositAmount: calculations.depositFirst + calculations.depositSecond,
      amountPaid: booking?.amountPaid || 0,
      balanceDue: calculations.totalCost - (booking?.amountPaid || 0),
      paymentStatus: booking?.paymentStatus || "pending",
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
                    <Calendar
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
                    <Calendar
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculations.totalCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">1st Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(calculations.depositFirst)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">2nd Deposit (25%)</p>
                  <p className="font-semibold">{formatCurrency(calculations.depositSecond)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Balance Due (50%)</p>
                  <p className="font-semibold">{formatCurrency(calculations.balance)}</p>
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
