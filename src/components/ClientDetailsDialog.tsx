
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Booking, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Calendar } from "lucide-react";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  allExpenses: Expense[];
}

export function ClientDetailsDialog({ open, onOpenChange, booking, allExpenses }: ClientDetailsDialogProps) {
  const clientExpenses = allExpenses.filter(e => e.bookingId === booking.id);
  const totalExpenses = clientExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = booking.totalCost - totalExpenses;
  const profitMargin = booking.totalCost > 0 ? ((netProfit / booking.totalCost) * 100).toFixed(1) : "0";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Client Financial Details</DialogTitle>
          <DialogDescription>
            Complete financial breakdown for {booking.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                  <span className="font-medium">{booking.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Email:</span>
                  <span className="font-medium">{booking.contactEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                  <span className="font-medium">{booking.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Dates:</span>
                  <span className="font-medium">
                    {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Guests:</span>
                  <span className="font-medium">{booking.numberOfGuests} people</span>
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
                  <span className="font-bold text-green-600">{formatCurrency(booking.totalCost)}</span>
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
                <p className="font-bold text-green-600">{formatCurrency(booking.baseRate)}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium">Per Person Charges</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{booking.numberOfGuests} guests × ${booking.perPersonRate}</p>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(booking.numberOfGuests * booking.perPersonRate)}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium">Cleaning Fees</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Base: ${booking.cleaningFee} {booking.additionalCleaningFee > 0 && `+ Additional: $${booking.additionalCleaningFee}`}
                  </p>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(booking.cleaningFee + booking.additionalCleaningFee)}</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-600">
                <p className="font-bold text-lg">Total Revenue</p>
                <p className="font-bold text-2xl text-green-600">{formatCurrency(booking.totalCost)}</p>
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
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                            <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
                            <span>•</span>
                            <span>{expense.vendor}</span>
                            <span>•</span>
                            <span>{expense.paymentMethod.replace("_", " ")}</span>
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
                <span className="font-bold text-green-600">{formatCurrency(booking.amountPaid)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">Balance Due:</span>
                <span className={`font-bold ${booking.balanceDue > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {formatCurrency(booking.balanceDue)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">Payment Status:</span>
                <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                  {booking.paymentStatus.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Total Profit Summary Bar */}
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
                      Revenue ({formatCurrency(booking.totalCost)}) - Expenses ({formatCurrency(totalExpenses)})
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
  );
}
