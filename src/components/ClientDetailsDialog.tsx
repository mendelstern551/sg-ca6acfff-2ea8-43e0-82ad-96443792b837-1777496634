import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense, Booking } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Calendar, Users, FileText, Plus, StickyNote, Pencil } from "lucide-react";
import { InvoiceDialog } from "./InvoiceDialog";
import { useState } from "react";
import { paymentService } from "@/services/paymentService";
import { bookingService } from "@/services/bookingService";
import { invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  allExpenses: Expense[];
  onNavigateToExpenses?: (bookingId: string) => void;
}

export function ClientDetailsDialog({ 
  open, 
  onOpenChange, 
  booking, 
  allExpenses,
  onNavigateToExpenses 
}: ClientDetailsDialogProps) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [customerEditDialogOpen, setCustomerEditDialogOpen] = useState(false);
  const [localBooking, setLocalBooking] = useState(booking);
  
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [noteText, setNoteText] = useState(booking.notes || "");
  const [customerName, setCustomerName] = useState(booking.contact_name);
  const [customerEmail, setCustomerEmail] = useState(booking.contact_email || "");
  const [customerPhone, setCustomerPhone] = useState(booking.contact_phone || "");
  
  const { toast } = useToast();

  const clientExpenses = allExpenses.filter(e => e.booking_id === localBooking.id);
  const totalExpenses = clientExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = localBooking.total_cost - totalExpenses;
  const profitMargin = localBooking.total_cost > 0 ? ((netProfit / localBooking.total_cost) * 100).toFixed(1) : "0";

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await paymentService.createPayment({
        booking_id: localBooking.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: paymentNotes || undefined
      });

      const updatedBooking = await bookingService.getBookingById(localBooking.id);
      if (updatedBooking) {
        const totalPaid = updatedBooking.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const balanceDue = updatedBooking.total_cost - totalPaid;
        
        let paymentStatus: "pending" | "partial" | "paid" = "pending";
        if (balanceDue <= 0) paymentStatus = "paid";
        else if (totalPaid > 0) paymentStatus = "partial";

        await bookingService.updateBooking(localBooking.id, {
          amount_paid: totalPaid,
          balance_due: balanceDue,
          payment_status: paymentStatus
        });

        const refreshedBooking = await bookingService.getBookingById(localBooking.id);
        if (refreshedBooking) {
          setLocalBooking(refreshedBooking);
        }
      }

      toast({
        title: "Payment Added",
        description: `Payment of ${formatCurrency(parseFloat(paymentAmount))} recorded successfully.`
      });

      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentNotes("");
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        title: "Error",
        description: "Failed to add payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    try {
      setSubmitting(true);
      
      await bookingService.updateBooking(localBooking.id, {
        notes: noteText || null
      });

      const refreshedBooking = await bookingService.getBookingById(localBooking.id);
      if (refreshedBooking) {
        setLocalBooking(refreshedBooking);
      }

      toast({
        title: "Note Updated",
        description: "Booking note has been updated successfully."
      });

      setNoteDialogOpen(false);
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomerInfo = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Customer name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Update booking customer info
      await bookingService.updateBooking(localBooking.id, {
        contact_name: customerName,
        contact_email: customerEmail || null,
        contact_phone: customerPhone || null
      });

      // ✅ SYNC: Update invoice customer info automatically
      try {
        await invoiceService.updateInvoiceCustomerInfo(localBooking.id, {
          clientName: customerName,
          clientEmail: customerEmail || null,
          clientPhone: customerPhone || null
        });
      } catch (invoiceError) {
        console.warn("Could not update invoice (may not exist yet):", invoiceError);
      }

      // Refresh booking data
      const refreshedBooking = await bookingService.getBookingById(localBooking.id);
      if (refreshedBooking) {
        setLocalBooking(refreshedBooking);
        setCustomerName(refreshedBooking.contact_name);
        setCustomerEmail(refreshedBooking.contact_email || "");
        setCustomerPhone(refreshedBooking.contact_phone || "");
      }

      toast({
        title: "Customer Info Updated",
        description: "Customer information and invoice have been updated successfully."
      });

      setCustomerEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating customer info:", error);
      toast({
        title: "Error",
        description: "Failed to update customer information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      cleaning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      supplies: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      utilities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      staff: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      equipment: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      "Manager Salary": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      other: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[category] || colors.other;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-blue-600" />
                Client Details - {localBooking.contact_name}
              </DialogTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setCustomerEditDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Info
                </Button>
                <Button 
                  onClick={() => setPaymentDialogOpen(true)}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Payment
                </Button>
                <Button 
                  onClick={() => setNoteDialogOpen(true)}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <StickyNote className="h-4 w-4" />
                  Add Note
                </Button>
                <Button 
                  onClick={() => setInvoiceOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Invoice
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(localBooking.total_cost)}</p>
              </div>
              <div 
                className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                onClick={() => {
                  if (onNavigateToExpenses) {
                    onNavigateToExpenses(localBooking.id);
                    onOpenChange(false);
                  }
                }}
                title="Click to view expenses for this booking"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-slate-500 mt-1">Click to view details</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Net profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Booking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Contact:</span>
                    <span className="font-medium">{localBooking.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Email:</span>
                    <span className="font-medium">{localBooking.contact_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                    <span className="font-medium">{localBooking.contact_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Dates:</span>
                    <span className="font-medium">
                      {format(new Date(localBooking.start_date), "MMM d")} - {format(new Date(localBooking.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Guests:</span>
                    <span className="font-medium">{localBooking.number_of_guests} people</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total Revenue:</span>
                    <span className="font-bold text-green-600">{formatCurrency(localBooking.total_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total Expenses:</span>
                    <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-600 dark:text-slate-400">Net Profit:</span>
                    <span className={`font-bold text-lg ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Profit Margin:</span>
                    <span className={`font-medium ${parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Income Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Base Rate</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Resort rental fee</p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(localBooking.base_rate)}</p>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Per Person Charges</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{localBooking.number_of_guests} guests × ${localBooking.per_person_rate}</p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(localBooking.number_of_guests * localBooking.per_person_rate)}</p>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Cleaning Fees</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Base: ${localBooking.cleaning_fee} {localBooking.additional_cleaning_fee > 0 && `+ Additional: $${localBooking.additional_cleaning_fee}`}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(localBooking.cleaning_fee + localBooking.additional_cleaning_fee)}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-600">
                  <p className="font-bold text-lg">Total Revenue</p>
                  <p className="font-bold text-2xl text-green-600">{formatCurrency(localBooking.total_cost)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Expenses for This Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientExpenses.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No expenses recorded for this booking</p>
                ) : (
                  <div className="space-y-3">
                    {clientExpenses
                      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                      .map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{expense.description}</p>
                              <Badge className={getCategoryColor(expense.category)}>
                                {expense.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                              <span>{format(new Date(expense.expense_date), "MMM d, yyyy")}</span>
                              <span>•</span>
                              <span>{expense.vendor}</span>
                              <span>•</span>
                              <span>{(expense.payment_method || '').replace("_", " ")}</span>
                            </div>
                            {expense.notes && (
                              <p className="text-xs text-slate-500 mt-1">{expense.notes}</p>
                            )}
                          </div>
                          <p className="font-bold text-red-600 text-lg ml-4">{formatCurrency(expense.amount)}</p>
                        </div>
                      ))}
                    <div className="flex justify-between items-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-600 mt-4">
                      <p className="font-bold text-lg">Total Expenses</p>
                      <p className="font-bold text-2xl text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-green-600">{formatCurrency(localBooking.amount_paid)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">Balance Due:</span>
                  <span className={`font-bold ${localBooking.balance_due > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {formatCurrency(localBooking.balance_due)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">Payment Status:</span>
                  <Badge variant={localBooking.payment_status === "paid" ? "default" : "secondary"}>
                    {(localBooking.payment_status || '').replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${netProfit >= 0 ? "border-green-600 bg-green-50 dark:bg-green-950/20" : "border-red-600 bg-red-50 dark:bg-red-950/20"}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {netProfit >= 0 ? (
                      <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Profit for This Client</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Revenue ({formatCurrency(localBooking.total_cost)}) - Expenses ({formatCurrency(totalExpenses)})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-4xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Math.abs(netProfit))}
                    </p>
                    <p className={`text-sm font-medium ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {netProfit >= 0 ? "Profit" : "Loss"} • {profitMargin}% margin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={customerEditDialogOpen} onOpenChange={setCustomerEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Customer Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email Address</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="email@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ℹ️ Updating customer info will automatically sync to any existing invoices for this booking.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCustomerEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomerInfo} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Add Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes (Optional)</Label>
              <Textarea
                id="payment-notes"
                placeholder="Additional payment details..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? "Adding..." : "Add Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-blue-600" />
              Add/Update Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-text">Booking Note</Label>
              <Textarea
                id="note-text"
                placeholder="Add notes about this booking..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNote} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceDialog 
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        booking={localBooking}
      />
    </>
  );
}