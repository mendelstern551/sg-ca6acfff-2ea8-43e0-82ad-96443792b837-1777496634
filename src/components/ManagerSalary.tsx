
import { useState, useEffect } from "react";
import { Plus, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Booking, ManagerPayment, ManagerSalaryData, Expense, PaymentMethod } from "@/types/booking";
import { format, startOfMonth, isAfter, isBefore, differenceInMonths } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface ManagerSalaryProps {
  bookings: Booking[];
  onAddExpense: (expense: Expense) => void;
}

export function ManagerSalary({ bookings, onAddExpense }: ManagerSalaryProps) {
  const [salaryData, setSalaryData] = useState<ManagerSalaryData>({
    maintenanceFeePerMonth: 1000,
    commissionPercentage: 15,
    minimumCommissionPerEvent: 1000,
    seasonStart: "2025-10-01",
    seasonEnd: "2026-07-01",
    payments: []
  });

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date(),
    amount: 0,
    paymentMethod: "check" as PaymentMethod,
    referenceNumber: "",
    type: "maintenance" as "maintenance" | "commission" | "other",
    relatedBookingId: "",
    notes: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("trout-lake-manager-salary");
    if (saved) {
      setSalaryData(JSON.parse(saved));
    }
  }, []);

  const calculateMaintenanceFees = () => {
    const seasonStart = new Date(salaryData.seasonStart);
    const seasonEnd = new Date(salaryData.seasonEnd);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    if (isBefore(currentMonthStart, seasonStart)) {
      return 0;
    }

    if (isAfter(currentMonthStart, seasonEnd)) {
      const totalMonths = differenceInMonths(seasonEnd, seasonStart) + 1;
      return totalMonths * salaryData.maintenanceFeePerMonth;
    }

    const monthsElapsed = differenceInMonths(currentMonthStart, seasonStart) + 1;
    return monthsElapsed * salaryData.maintenanceFeePerMonth;
  };

  const getMonthsElapsedText = () => {
    const seasonStart = new Date(salaryData.seasonStart);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    if (isBefore(currentMonthStart, seasonStart)) {
      return "Season hasn't started";
    }

    const monthsElapsed = differenceInMonths(currentMonthStart, seasonStart) + 1;
    return `${monthsElapsed} ${monthsElapsed === 1 ? "month" : "months"} elapsed`;
  };

  const calculateCommissions = () => {
    return bookings.reduce((total, booking) => {
      const commission = Math.max(
        booking.totalCost * (salaryData.commissionPercentage / 100),
        salaryData.minimumCommissionPerEvent
      );
      return total + commission;
    }, 0);
  };

  const totalMaintenanceFees = calculateMaintenanceFees();
  const totalCommissions = calculateCommissions();
  const totalOwed = totalMaintenanceFees + totalCommissions;
  const totalPaid = salaryData.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalOwed - totalPaid;

  const handleAddPayment = () => {
    const newPayment: ManagerPayment = {
      id: Date.now().toString(),
      date: paymentForm.date.toISOString(),
      amount: paymentForm.amount,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber,
      type: paymentForm.type,
      relatedBookingId: paymentForm.relatedBookingId || undefined,
      notes: paymentForm.notes,
      createdAt: new Date().toISOString()
    };

    const updatedData = {
      ...salaryData,
      payments: [...salaryData.payments, newPayment]
    };

    setSalaryData(updatedData);
    localStorage.setItem("trout-lake-manager-salary", JSON.stringify(updatedData));

    const expense: Expense = {
      id: Date.now().toString(),
      bookingId: paymentForm.relatedBookingId || undefined,
      date: paymentForm.date.toISOString(),
      amount: paymentForm.amount,
      category: "Manager Salary",
      description: `Manager payment - ${paymentForm.type}`,
      paymentMethod: paymentForm.paymentMethod,
      vendor: "Manager",
      notes: paymentForm.notes,
      createdAt: new Date().toISOString()
    };

    onAddExpense(expense);

    setPaymentForm({
      date: new Date(),
      amount: 0,
      paymentMethod: "check",
      referenceNumber: "",
      type: "maintenance",
      relatedBookingId: "",
      notes: ""
    });
    setPaymentDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Fees</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceFees.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {getMonthsElapsedText()}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              15% per booking (min $1,000)
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {salaryData.payments.length} payments made
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceDue > 0 ? "text-orange-600" : "text-green-600"}`}>
              ${balanceDue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Remaining to pay
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown</CardTitle>
            <CardDescription>15% commission per booking with $1,000 minimum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No bookings yet</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((booking) => {
                    const commission = Math.max(
                      booking.totalCost * (salaryData.commissionPercentage / 100),
                      salaryData.minimumCommissionPerEvent
                    );
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{booking.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {format(new Date(booking.startDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${commission.toLocaleString()}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {commission === salaryData.minimumCommissionPerEvent ? "Minimum" : "15%"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Track all payments made to manager</CardDescription>
              </div>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Manager Payment</DialogTitle>
                    <DialogDescription>
                      This will automatically create an expense entry
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(paymentForm.date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={paymentForm.date}
                            onSelect={(date) => date && setPaymentForm({ ...paymentForm, date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select
                        value={paymentForm.type}
                        onValueChange={(value: "maintenance" | "commission" | "other") =>
                          setPaymentForm({ ...paymentForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                          <SelectItem value="commission">Commission</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentForm.type === "commission" && (
                      <div className="space-y-2">
                        <Label htmlFor="booking">Related Booking (Optional)</Label>
                        <Select
                          value={paymentForm.relatedBookingId}
                          onValueChange={(value) => setPaymentForm({ ...paymentForm, relatedBookingId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {bookings.map((booking) => (
                              <SelectItem key={booking.id} value={booking.id}>
                                {booking.name} - {format(new Date(booking.startDate), "MMM d, yyyy")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentForm.paymentMethod}
                        onValueChange={(value: PaymentMethod) =>
                          setPaymentForm({ ...paymentForm, paymentMethod: value })
                        }
                      >
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
                      <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
                      <Input
                        id="referenceNumber"
                        value={paymentForm.referenceNumber}
                        onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                        placeholder="Check #, Transaction ID, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Any additional information..."
                        rows={3}
                      />
                    </div>

                    <Button onClick={handleAddPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                      Record Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {salaryData.payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No payments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {salaryData.payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            ${payment.amount.toLocaleString()}
                          </p>
                          <Badge variant={payment.type === "maintenance" ? "default" : "secondary"}>
                            {payment.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {format(new Date(payment.date), "MMM d, yyyy")} • {payment.paymentMethod}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
