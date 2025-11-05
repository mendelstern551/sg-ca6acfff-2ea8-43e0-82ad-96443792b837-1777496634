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
import { BookingCalendar } from "@/components/BookingCalendar";
import { ReceiptLibrary } from "@/components/ReceiptLibrary";
import { bookingService, type Booking as SupabaseBooking, type Payment as SupabasePayment } from "@/services/bookingService";
import { expenseService, type Expense as SupabaseExpense } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Booking, Expense, Payment, BookingType, PaymentStatus } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filteredBookingId, setFilteredBookingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();

    // Set up real-time subscriptions for cross-browser sync
    const bookingsSubscription = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking change received:', payload);
          loadAllData(); // Reload all data when bookings change
        }
      )
      .subscribe();

    const expensesSubscription = supabase
      .channel('expenses-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('Expense change received:', payload);
          loadAllData(); // Reload all data when expenses change
        }
      )
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment change received:', payload);
          loadAllData(); // Reload all data when payments change
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      bookingsSubscription.unsubscribe();
      expensesSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [bookingsData, expensesData] = await Promise.all([
        bookingService.getAllBookings(),
        expenseService.getAllExpenses()
      ]);

      const mappedBookings: Booking[] = bookingsData.map((b: SupabaseBooking): Booking => {
        const payments = (b.payments || []).map((p: SupabasePayment): Payment => ({
          id: p.id,
          bookingId: p.booking_id,
          amount: Number(p.amount),
          payment_date: p.payment_date,
          payment_method: p.payment_method as any, // Cast for now
          notes: p.notes,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        
        return {
          id: b.id,
          name: b.name,
          bookingType: b.booking_type as BookingType,
          contactName: b.contact_name,
          contactEmail: b.contact_email,
          contactPhone: b.contact_phone,
          startDate: b.start_date,
          endDate: b.end_date,
          numberOfGuests: b.number_of_guests,
          baseRate: Number(b.base_rate),
          perPersonRate: Number(b.per_person_rate),
          cleaningFee: Number(b.cleaning_fee),
          additionalCleaningFee: Number(b.additional_cleaning_fee),
          totalCost: Number(b.total_cost),
          depositAmount: Number(b.deposit_amount),
          amountPaid: Number(b.amount_paid),
          balanceDue: Number(b.balance_due),
          paymentStatus: b.payment_status as PaymentStatus,
          confirmed: b.confirmed,
          customPrice: b.custom_price ? Number(b.custom_price) : null,
          discountPercent: b.discount_percent ? Number(b.discount_percent) : null,
          notes: b.notes,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          payments: payments,
        };
      });

      const mappedExpenses: Expense[] = expensesData.map((e: SupabaseExpense): Expense => ({
        id: e.id,
        bookingId: e.booking_id,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        vendor: e.vendor,
        paymentMethod: e.payment_method,
        date: e.expense_date,
        receiptUrls: e.receipt_urls,
        proofUrls: e.proof_urls,
        notes: e.notes,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      }));

      setBookings(mappedBookings);
      setExpenses(mappedExpenses);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load bookings and expenses from the database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBooking = async (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) => {
    try {
      // CRITICAL FIX: Calculate amountPaid from actual payment records, not from stored field
      // This ensures that when custom pricing is applied, the balance is recalculated correctly
      const existingPayments = editingBooking?.payments || [];
      const amountPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = booking.totalCost - amountPaid;

      // Determine payment status based on balance
      let paymentStatus: "pending" | "partial" | "paid" = "pending";
      if (balanceDue <= 0) {
        paymentStatus = "paid";
      } else if (amountPaid > 0) {
        paymentStatus = "partial";
      }

      const bookingData = {
        name: booking.name,
        booking_type: booking.bookingType,
        contact_name: booking.contactName,
        contact_email: booking.contactEmail,
        contact_phone: booking.contactPhone,
        start_date: booking.startDate,
        end_date: booking.endDate,
        number_of_guests: booking.numberOfGuests,
        base_rate: booking.baseRate,
        per_person_rate: booking.perPersonRate,
        cleaning_fee: booking.cleaningFee,
        additional_cleaning_fee: booking.additionalCleaningFee,
        total_cost: booking.totalCost,
        deposit_amount: booking.depositAmount,
        amount_paid: amountPaid, // Use calculated value from payments
        balance_due: balanceDue, // Use recalculated balance
        payment_status: paymentStatus, // Auto-update payment status
        confirmed: booking.confirmed,
        custom_price: booking.customPrice,
        discount_percent: booking.discountPercent,
        notes: booking.notes,
      };

      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, bookingData);
        toast({
          title: "Booking Updated",
          description: `Balance due recalculated: ${formatCurrency(balanceDue)}`
        });
      } else {
        await bookingService.createBooking(bookingData);
        toast({
          title: "Booking Created",
          description: "New booking has been created successfully."
        });
      }

      await loadAllData();
      setEditingBooking(undefined);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        title: "Error",
        description: "Failed to save booking. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateBooking = async (booking: Booking) => {
    try {
      await bookingService.updateBooking(booking.id, {
        name: booking.name,
        booking_type: booking.bookingType,
        contact_name: booking.contactName,
        contact_email: booking.contactEmail,
        contact_phone: booking.contactPhone,
        start_date: booking.startDate,
        end_date: booking.endDate,
        number_of_guests: booking.numberOfGuests,
        base_rate: booking.baseRate,
        per_person_rate: booking.perPersonRate,
        cleaning_fee: booking.cleaningFee,
        additional_cleaning_fee: booking.additionalCleaningFee,
        total_cost: booking.totalCost,
        deposit_amount: booking.depositAmount,
        amount_paid: booking.amountPaid,
        balance_due: booking.balanceDue,
        payment_status: booking.paymentStatus,
        confirmed: booking.confirmed,
        custom_price: booking.customPrice,
        discount_percent: booking.discountPercent,
        notes: booking.notes
      });

      await loadAllData();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking.",
        variant: "destructive"
      });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingDialogOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await bookingService.deleteBooking(bookingId);
      toast({
        title: "Booking Deleted",
        description: "The booking has been deleted successfully."
      });
      await loadAllData();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({
        title: "Error",
        description: "Failed to delete booking.",
        variant: "destructive"
      });
    }
  };

  const handleSaveExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    try {
      const expenseData = {
        booking_id: expense.bookingId,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        vendor: expense.vendor,
        payment_method: expense.paymentMethod,
        expense_date: expense.date,
        receipt_urls: expense.receiptUrls,
        proof_urls: expense.proofUrls,
        notes: expense.notes
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseData);
        toast({
          title: "Expense Updated",
          description: "The expense has been updated successfully."
        });
      } else {
        await expenseService.createExpense(expenseData);
        toast({
          title: "Expense Created",
          description: "New expense has been recorded successfully."
        });
      }

      await loadAllData();
      setEditingExpense(undefined);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense.",
        variant: "destructive"
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      toast({
        title: "Expense Deleted",
        description: "The expense has been deleted successfully."
      });
      await loadAllData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense.",
        variant: "destructive"
      });
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    try {
      await expenseService.createExpense({
        booking_id: expense.bookingId,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        vendor: expense.vendor,
        payment_method: expense.paymentMethod,
        expense_date: expense.date,
        receipt_urls: expense.receiptUrls,
        proof_urls: expense.proofUrls,
        notes: expense.notes
      });
      await loadAllData();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };
  
  const handleNavigateToExpenses = (bookingId: string) => {
    setFilteredBookingId(bookingId);
    setActiveTab("expenses");
  };

  const totalGuests = bookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your data...</p>
        </div>
      </div>
    );
  }

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
          {/* Summary Cards */}
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

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (value !== "expenses") {
            setFilteredBookingId(undefined);
          }
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
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
                    key={refreshKey}
                    bookings={bookings}
                    onEdit={handleEditBooking}
                    onDelete={handleDeleteBooking}
                    onUpdateBooking={handleUpdateBooking}
                    expenses={expenses}
                    onNavigateToExpenses={handleNavigateToExpenses}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <BookingCalendar 
              key={`calendar-${refreshKey}-${bookings.length}`}
              bookings={bookings} 
              onBookingClick={handleEditBooking}
              onAddBooking={() => {
                setEditingBooking(undefined);
                setBookingDialogOpen(true);
              }}
            />
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
                    filterBookingId={filteredBookingId}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <ReceiptLibrary expenses={expenses} bookings={bookings} />
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
        bookings={bookings}
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