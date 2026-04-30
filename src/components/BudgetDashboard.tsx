import { Booking, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PieChart } from "lucide-react";
import { DEFAULT_EVENT_MARGIN_CONFIG, type EventMarginConfig } from "@/types/eventMargin";
import { useAppSetting } from "@/lib/settingsStore";

interface BudgetDashboardProps {
  bookings: Booking[];
  expenses: Expense[];
}

export function BudgetDashboard({ bookings, expenses }: BudgetDashboardProps) {
  const [selectedBooking, setSelectedBooking] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Live EventMargin config from app_settings — synced across devices.
  const marginConfig = useAppSetting<EventMarginConfig>("event-margin", DEFAULT_EVENT_MARGIN_CONFIG);

  const filteredBookings = bookings.filter(booking => {
    const bookingMatch = selectedBooking === "all" || booking.id === selectedBooking;
    const bookingDate = new Date(booking.start_date);
    const dateMatch = (!startDate || bookingDate >= startDate) && 
                     (!endDate || bookingDate <= endDate);
    return bookingMatch && dateMatch;
  });

  const filteredExpenses = expenses.filter(expense => {
    const bookingMatch = selectedBooking === "all" || expense.booking_id === selectedBooking;
    const categoryMatch = selectedCategory === "all" || expense.category === selectedCategory;
    const expenseDate = new Date(expense.expense_date);
    const dateMatch = (!startDate || expenseDate >= startDate) && 
                     (!endDate || expenseDate <= endDate);
    return bookingMatch && categoryMatch && dateMatch;
  });

  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.total_cost, 0);

  // Per-event variable costs from the EventMargin tab — same model used there:
  //   manager commission (max(%, $floor)) + per-event line items, computed per booking.
  const perEventLineSum = (marginConfig.perEventExpenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const computedBookingExpenses = filteredBookings.reduce((sum, b) => {
    const commission = Math.max(
      (Number(b.total_cost) || 0) * (marginConfig.manager.commissionPercent / 100),
      marginConfig.manager.minimumCommissionPerEvent
    );
    return sum + commission + perEventLineSum;
  }, 0);
  // DB-tracked expenses (food, ad-hoc, manager payments etc.)
  // Skip "Manager Salary" expenses — those are auto-created by ManagerSalary's
  // commission generator and are already counted in computedBookingExpenses above.
  // Including them here would double-bill manager fees.
  const dbExpenses = filteredExpenses.reduce(
    (sum, expense) => (expense.category === "Manager Salary" ? sum : sum + expense.amount),
    0
  );

  const totalExpenses = computedBookingExpenses + dbExpenses;
  const netProfit = totalRevenue - totalExpenses;

  const totalPaid = filteredBookings.reduce((sum, booking) => sum + (booking.amount_paid || 0), 0);
  const totalBalance = filteredBookings.reduce((sum, booking) => sum + booking.balance_due, 0);

  const categoryExpenses = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const categories = ["all", "food", "cleaning", "supplies", "utilities", "staff", "equipment", "Manager Salary", "other"];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Food & Catering",
      cleaning: "Cleaning & Maintenance",
      supplies: "Supplies",
      utilities: "Utilities",
      staff: "Staff & Labor",
      equipment: "Equipment",
      "Manager Salary": "Manager Salary",
      other: "Other",
    };
    return labels[category] || category;
  };

  const hasActiveFilters = selectedBooking !== "all" || selectedCategory !== "all" || startDate || endDate;

  const clearFilters = () => {
    setSelectedBooking("all");
    setSelectedCategory("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter Budget Data
          </CardTitle>
          <CardDescription>
            Filter by booking, category, and date range to see specific financial summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Booking</label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger>
                  <SelectValue placeholder="All Bookings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expense Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c !== "all").map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredBookings.length} of {bookings.length} bookings and {filteredExpenses.length} of {expenses.length} expenses
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">From {filteredBookings.length} bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{filteredExpenses.length} recorded expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <PieChart className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(netProfit)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Net Profit / Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Collected</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Outstanding</span>
                <span className="text-lg font-bold text-orange-600">{formatCurrency(totalBalance)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium text-lg">Total Revenue</span>
                <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
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
                  .filter((e) => e.booking_id === booking.id)
                  .reduce((sum, e) => sum + e.amount, 0);
                const bookingProfit = booking.total_cost - bookingExpenses;
                
                return (
                  <div key={booking.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{booking.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booking.number_of_guests} guests
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
                        <p className="font-medium">{formatCurrency(booking.total_cost)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Expenses</p>
                        <p className="font-medium text-red-600">{formatCurrency(bookingExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Balance Due</p>
                        <p className="font-medium">{formatCurrency(booking.balance_due)}</p>
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
