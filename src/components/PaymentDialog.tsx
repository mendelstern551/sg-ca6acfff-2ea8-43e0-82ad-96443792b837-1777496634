import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Payment, PaymentMethod } from "@/types/booking";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment;
  bookingId: string;
  onSave: (payment: Payment) => void;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  check: "Check",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  venmo: "Venmo",
  zelle: "Zelle",
  other: "Other",
};

export function PaymentDialog({ open, onOpenChange, payment, bookingId, onSave }: PaymentDialogProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: undefined as Date | undefined,
    payment_method: "cash" as PaymentMethod,
    notes: "",
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount,
        payment_date: new Date(payment.payment_date),
        payment_method: payment.payment_method,
        notes: payment.notes || "",
      });
    } else {
      resetForm();
    }
  }, [payment, open]);

  const resetForm = () => {
    setFormData({
      amount: 0,
      payment_date: new Date(),
      payment_method: "cash",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.payment_date) {
      alert("Please select a payment date");
      return;
    }

    if (formData.amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const newPayment: Payment = {
      id: payment?.id || `payment-${Date.now()}`,
      bookingId,
      amount: formData.amount,
      payment_date: formData.payment_date.toISOString(),
      payment_method: formData.payment_method,
      notes: formData.notes,
      created_at: payment?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    onSave(newPayment);
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {payment ? "Edit Payment" : "Add Payment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.payment_date ? format(formData.payment_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={formData.payment_date}
                    onSelect={(date) => setFormData({ ...formData, payment_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes about this payment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {payment ? "Update Payment" : "Add Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
