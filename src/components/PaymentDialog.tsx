import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Booking, PaymentMethod } from "@/types/booking";
import { paymentService, Payment } from "@/services/paymentService";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  check: "Check",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  venmo: "Venmo",
  zelle: "Zelle",
  other: "Other",
  pending: "Pending"
};

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | undefined;
  onPaymentAdded: () => void;
  editingPayment?: Payment;
}

export function PaymentDialog({ open, onOpenChange, booking, onPaymentAdded, editingPayment }: PaymentDialogProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setAmount(editingPayment.amount);
        setPaymentDate(new Date(editingPayment.payment_date));
        setPaymentMethod(editingPayment.payment_method as PaymentMethod);
        setNotes(editingPayment.notes || "");
      } else {
        resetForm();
      }
    }
  }, [open, booking, editingPayment]);
  
  const resetForm = () => {
    setAmount("");
    setPaymentDate(new Date());
    setPaymentMethod("credit_card");
    setNotes("");
  };

  const handleSavePayment = async () => {
    if (!booking || !paymentDate || amount === "" || Number(amount) <= 0) {
      toast({
        title: "Invalid Payment",
        description: "Please enter a valid amount and date.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPayment) {
        await paymentService.updatePayment(editingPayment.id, {
          amount: Number(amount),
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          notes,
        });

        toast({
          title: "Payment Updated",
          description: "The payment has been successfully updated.",
        });
      } else {
        await paymentService.createPayment({
          booking_id: booking.id,
          amount: Number(amount),
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          notes,
        });

        toast({
          title: "Payment Recorded",
          description: "The payment has been successfully added.",
        });
      }

      onPaymentAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Error",
        description: "Failed to save payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPayment ? "Edit" : "Add"} Payment for {booking?.name}</DialogTitle>
          <DialogDescription>
            {editingPayment ? "Update the payment details below." : "Record a new payment for this booking."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || "")}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <EnhancedCalendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels)
                  .filter(([key]) => key !== 'pending')
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deposit, final payment, etc."
            />
          </div>

          <Button onClick={handleSavePayment} className="w-full">
            {editingPayment ? "Update Payment" : "Save Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
