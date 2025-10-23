import { useState, useEffect } from "react";
import { Calendar, Users, DollarSign, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { BookingDialog } from "@/components/BookingDialog";
import { BookingList } from "@/components/BookingList";
import { ExpenseDialog } from "@/components/ExpenseDialog";
import { ExpenseList } from "@/components/ExpenseList";
import { BudgetDashboard } from "@/components/BudgetDashboard";
import { ManagerSalary } from "@/components/ManagerSalary";
import { Booking, Expense } from "@/types/booking";
import { BookingCalendar } from "@/components/BookingCalendar";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  useEffect(() => {
    const savedBookings = localStorage.getItem("trout-lake-bookings");
    const savedExpenses = localStorage.getItem("trout-lake-expenses");
    
    if (savedBookings) {
      const bookingsData: Booking[] = JSON.parse(savedBookings);
      // Simple migration for old data that might not have the 'confirmed' field
      const migratedBookings = bookingsData.map(b => ({
        ...b,
        confirmed: b.confirmed ?? false 
      }));
      setBookings(migratedBookings);
    }
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  const handleSaveBooking = (booking: Booking) => {
    let updatedBookings: Booking[];
    
    if (editingBooking) {
      updatedBookings = bookings.map((b) => (b.id === booking.id ? booking : b));
    } else {
      updatedBookings = [...bookings, booking];
    }
    
    setBookings(updatedBookings);
    localStorage.setItem("trout-lake-bookings", JSON.stringify(updatedBookings));
    setEditingBooking(undefined);
  };

  const handleUpdateBooking = (booking: Booking) => {
    const updatedBookings = bookings.map((b) => (b.id === booking.id ? booking : b));
    setBookings(updatedBookings);
    localStorage.setItem("trout-lake-bookings", JSON.stringify(updatedBookings));
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingDialogOpen(true);
  };

  const handleDeleteBooking = (bookingId: string) => {
    const updatedBookings = bookings.filter((b) => b.id !== bookingId);
    setBookings(updatedBookings);
    localStorage.setItem("trout-lake-bookings", JSON.stringify(updatedBookings));
  };

  const handleSaveExpense = (expense: Expense) => {
    let updatedExpenses: Expense[];
    
    if (editingExpense) {
      updatedExpenses = expenses.map((e) => (e.id === expense.id ? expense : e));
    } else {
      updatedExpenses = [...expenses, expense];
    }
    
    setExpenses(updatedExpenses);
    localStorage.setItem("trout-lake-expenses", JSON.stringify(updatedExpenses));
    setEditingExpense(undefined);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updatedExpenses);
    localStorage.setItem("trout-lake-expenses", JSON.stringify(updatedExpenses));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => {
      const exists = prev.some(e => e.id === expense.id);
      if (exists) {
        return prev;
      }
      const updated = [...prev, expense];
      localStorage.setItem("trout-lake-expenses", JSON.stringify(updated));
      return updated;
    });
  };

  const totalGuests = bookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-50">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Trout Lake Resort
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Booking Management System
              </p>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Active reservations
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGuests}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Expected attendees
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                From all bookings
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netProfit.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Revenue - Expenses
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Bookings</CardTitle>
                    <CardDescription>
                      Manage your Yom Tov, Shabaton, and Night Event bookings
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setEditingBooking(undefined);
                      setBookingDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No bookings yet</p>
                    <p className="text-sm">Create your first booking to get started</p>
                  </div>
                ) : (
                  <BookingList
                    bookings={bookings}
                    onEdit={handleEditBooking}
                    onDelete={handleDeleteBooking}
                    onUpdateBooking={handleUpdateBooking}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <BookingCalendar bookings={bookings} onBookingClick={handleEditBooking} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <BudgetDashboard bookings={bookings} expenses={expenses} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expense Tracking</CardTitle>
                    <CardDescription>
                      Record expenses with receipts and payment proof
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setEditingExpense(undefined);
                      setExpenseDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No expenses recorded</p>
                    <p className="text-sm">Start tracking your expenses with receipts</p>
                  </div>
                ) : (
                  <ExpenseList
                    expenses={expenses}
                    bookings={bookings}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manager" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manager Compensation</CardTitle>
                <CardDescription>
                  Track maintenance fees, commissions, and payments to manager
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManagerSalary bookings={bookings} onAddExpense={handleAddExpense} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onSave={handleSaveBooking}
        booking={editingBooking}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSave={handleSaveExpense}
        expense={editingExpense}
        bookings={bookings}
      />
    </div>
  );
}
