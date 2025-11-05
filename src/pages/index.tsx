
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
import { invoiceService } from "@/services/invoiceService";

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
          loadAllData();
        }
      )
      .subscribe();

    const expensesSubscription = supabase
      .channel('expenses-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('Expense change received:', payload);
          loadAllData();
        }
      )
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment change received:', payload);
          loadAllData();
        }
      )
      .subscribe();

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
          payment_method: p.payment_method as any,
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
          numberOfRooms: b.number_of_rooms || 1,
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
      const existingPayments = editingBooking?.payments || [];
      const amountPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = booking.totalCost - amountPaid;

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
        number_of_rooms: booking.numberOfRooms,
        base_rate: booking.baseRate,
        per_person_rate: booking.perPersonRate,
        cleaning_fee: booking.cleaningFee,
        additional_cleaning_fee: booking.additionalCleaningFee,
        total_cost: booking.totalCost,
        deposit_amount: booking.depositAmount,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_status: paymentStatus,
        confirmed: booking.confirmed,
        custom_price: booking.customPrice,
        discount_percent: booking.discountPercent,
        notes: booking.notes,
      };

      let savedBookingId: string;

      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, bookingData);
        savedBookingId = editingBooking.id;
        toast({
          title: "Booking Updated",
          description: `Balance due recalculated: ${formatCurrency(balanceDue)}`
        });
      } else {
        const newBooking = await bookingService.createBooking(bookingData);
        savedBookingId = newBooking.id;
        toast({
          title: "Booking Created",
          description: "New booking has been created successfully."
        });
      }

      // Auto-generate invoice if booking is confirmed
      if (booking.confirmed) {
        try {
          const existingInvoice = await invoiceService.getInvoiceByBookingId(savedBookingId);
          
          if (!existingInvoice) {
            await invoiceService.createInvoice(savedBookingId, {
              clientName: booking.contactName,
              clientEmail: booking.contactEmail || undefined,
              clientPhone: booking.contactPhone || undefined,
              eventDateStart: booking.startDate,
              eventDateEnd: booking.endDate,
              numberOfGuests: booking.numberOfGuests,
              numberOfRooms: booking.numberOfRooms,
              basePrice: booking.totalCost,
              depositAmount: booking.depositAmount,
              balanceDue: balanceDue,
              totalAmount: booking.totalCost,
              notes: booking.notes || undefined
            });
            
            toast({
              title: "✓ Invoice Generated",
              description: "A professional invoice has been automatically created for this confirmed booking.",
              variant: "default"
            });
          }
        } catch (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
          toast({
            title: "Invoice Creation Failed",
            description: "Booking saved, but invoice creation failed. You can create it manually later.",
            variant: "destructive"
          });
        }
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
        number_of_rooms: booking.numberOfRooms,
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-blue-50 dark:from-stone-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-stone-600 dark:text-stone-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-blue-50 dark:from-stone-950 dark:via-slate-900 dark:to-indigo-950">
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                Trout Lake Resort
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                Booking Management System
              </p>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Bookings</CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{bookings.length}</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Active reservations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Guests</CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalGuests}</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Expected attendees
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Revenue</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                From all bookings
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Net Profit</CardTitle>
              <div className={`p-2 ${netProfit >= 0 ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}>
                <FileText className={`h-4 w-4 ${netProfit >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-cyan-600 dark:text-cyan-400" : "text-red-600 dark:text-red-400"}`}>
                ${netProfit.toLocaleString()}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
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
          <TabsList className="grid w-full grid-cols-7 lg:w-[1050px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Bookings</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Calendar</TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Invoices</TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Budget</TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Expenses</TabsTrigger>
            <TabsTrigger value="receipts" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Receipts</TabsTrigger>
            <TabsTrigger value="manager" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-100">Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-stone-900 dark:text-stone-100">All Bookings</CardTitle>
                    <CardDescription className="text-stone-600 dark:text-stone-400">
                      Manage your Yom Tov, Shabaton, and Night Event bookings
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
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
                  <div className="text-center py-12 text-stone-500 dark:text-stone-400">
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

          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Invoice Management
                    </CardTitle>
                    <CardDescription className="text-stone-600 dark:text-stone-400">
                      View all invoices for your bookings
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                    onClick={() => window.location.href = "/invoices"}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View All Invoices
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-blue-300 dark:text-blue-700" />
                  <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                    Invoice Management System
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
                    All invoices are automatically generated for each booking with detailed cost breakdowns. 
                    Click the button above to view and manage all invoices, or use the "Open Invoice" button in any client details dialog.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Auto-Generated</h4>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Invoices created automatically for each booking</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Cost Breakdown</h4>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Detailed breakdown of all charges and payments</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Download PDF</h4>
                      <p className="text-sm text-stone-600 dark:text-stone-400">Print or download invoices as PDF</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <BudgetDashboard bookings={bookings} expenses={expenses} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-stone-900 dark:text-stone-100">Expense Tracking</CardTitle>
                    <CardDescription className="text-stone-600 dark:text-stone-400">
                      Record expenses with receipts and payment proof
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all"
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
                  <div className="text-center py-12 text-stone-500 dark:text-stone-400">
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
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <CardTitle className="text-stone-900 dark:text-stone-100">Manager Compensation</CardTitle>
                <CardDescription className="text-stone-600 dark:text-stone-400">
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
