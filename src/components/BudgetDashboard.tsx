
import { Booking, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface BudgetDashboardProps {
  bookings: Booking[];
  expenses: Expense[];
}

export function BudgetDashboard({ bookings, expenses }: BudgetDashboardProps) {
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const totalPaid = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalBalance = bookings.reduce((sum, b) => sum + b.balanceDue, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Food & Catering",
      cleaning: "Cleaning & Maintenance",
      supplies: "Supplies",
      utilities: "Utilities",
      staff: "Staff & Labor",
      equipment: "Equipment",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              From {bookings.length} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {expenses.length} expense records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Net profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">Collected</span>
                <span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <Progress 
                value={totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">Outstanding</span>
                <span className="font-medium">{formatCurrency(totalBalance)}</span>
              </div>
              <Progress 
                value={totalRevenue > 0 ? (totalBalance / totalRevenue) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="font-medium">Total Expected</span>
                <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map(([category, amount]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        {getCategoryLabel(category)}
                      </span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                    <Progress 
                      value={totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No expenses recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Summary by Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const bookingExpenses = expenses
                  .filter((e) => e.bookingId === booking.id)
                  .reduce((sum, e) => sum + e.amount, 0);
                const bookingProfit = booking.totalCost - bookingExpenses;
                
                return (
                  <div key={booking.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{booking.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.numberOfGuests} guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(bookingProfit)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Net profit
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Revenue</p>
                        <p className="font-medium">{formatCurrency(booking.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Expenses</p>
                        <p className="font-medium text-red-600">{formatCurrency(bookingExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Balance Due</p>
                        <p className="font-medium">{formatCurrency(booking.balanceDue)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              No bookings to display
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
