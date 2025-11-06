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
import { bookingService } from "@/services/bookingService";
import { expenseService } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Booking, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { invoiceService } from "@/services/invoiceService";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { format } from "date-fns";
import { managerService } from "@/services/managerService";
import type { ManagerCompensation } from "@/services/managerService";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [managerCompensations, setManagerCompensations] = useState<ManagerCompensation[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filteredBookingId, setFilteredBookingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | undefined>();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    const channel = supabase.channel('db-changes');
    const subscription = channel
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        console.log('Database change received:', payload);
        loadAllData();
      })
      .subscribe();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadAllData();
    }, 30000); // 30 seconds
    
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load data with individual error handling for each service
      const results = await Promise.allSettled([
        bookingService.getAllBookings(),
        expenseService.getAllExpenses(),
        invoiceService.getAllInvoices(),
        managerService.getAllCompensation()
      ]);

      // Extract successful results
      const bookingsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const expensesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const invoicesData = results[2].status === 'fulfilled' ? results[2].value : [];
      const managerData = results[3].status === 'fulfilled' ? results[3].value : [];

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const serviceName = ['Bookings', 'Expenses', 'Invoices', 'Manager'][index];
          console.error(`${serviceName} service error:`, result.reason);
        }
      });

      const bookingsWithPayments = bookingsData.map(b => ({
        ...b,
        payments: b.payments || [],
      }));

      setBookings(bookingsWithPayments);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setManagerCompensations(managerData);

      // Only show error toast if critical services failed (bookings/expenses)
      if (results[0].status === 'rejected' || results[1].status === 'rejected') {
        toast({
          title: "Partial Load Failure",
          description: "Some data couldn't be loaded. Retrying automatically...",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load data. The app will retry automatically every 30 seconds.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, "id" | "created_at" | "updated_at" | "payments">) => {
    try {
      const amountPaid = editingBooking?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const balanceDue = bookingData.total_cost - amountPaid;

      let paymentStatus: "pending" | "partial" | "paid" = "pending";
      if (balanceDue <= 0) paymentStatus = "paid";
      else if (amountPaid > 0) paymentStatus = "partial";
      
      const dataToSave: Omit<Booking, "id" | "created_at" | "updated_at" | "payments"> & { amount_paid: number, balance_due: number, payment_status: any } = {
          ...bookingData,
          amount_paid: amountPaid,
          balance_due: balanceDue,
          payment_status: paymentStatus
      };

      let savedBookingId: string;

      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, dataToSave as BookingUpdate);
        savedBookingId = editingBooking.id;
        toast({ title: "Booking Updated", description: `Balance due recalculated: ${formatCurrency(balanceDue)}` });
      } else {
        const newBooking = await bookingService.createBooking(dataToSave as BookingInsert);
        savedBookingId = newBooking.id;
        toast({ title: "Booking Created", description: "New booking has been created successfully." });
      }

      if (bookingData.confirmed) {
        try {
          const existingInvoice = await invoiceService.getInvoiceByBookingId(savedBookingId);
          if (!existingInvoice) {
            await invoiceService.createInvoice(savedBookingId, {
              clientName: bookingData.contact_name, clientEmail: bookingData.contact_email || undefined, clientPhone: bookingData.contact_phone || undefined,
              eventDateStart: bookingData.start_date, eventDateEnd: bookingData.end_date, numberOfGuests: bookingData.number_of_guests,
              numberOfRooms: bookingData.number_of_rooms || 1, basePrice: bookingData.total_cost, depositAmount: amountPaid,
              balanceDue: balanceDue, totalAmount: bookingData.total_cost, notes: bookingData.notes || undefined
            });
            toast({ title: "✓ Invoice Generated", description: "An invoice has been automatically created.", variant: "default" });
          }
        } catch (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
          toast({ title: "Invoice Creation Failed", description: "Booking saved, but invoice creation failed.", variant: "destructive" });
        }
      }

      await loadAllData();
      setEditingBooking(undefined);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({ title: "Error", description: "Failed to save booking. Please try again.", variant: "destructive" });
    }
  };
  
  const handleUpdateBooking = async (booking: Booking) => {
    try {
      await bookingService.updateBooking(booking.id, booking);
      await loadAllData();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingDialogOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      // First, delete any manager commission expenses associated with this booking
      const commissionExpenses = expenses.filter(
        exp => exp.booking_id === bookingId && 
        exp.category === "Manager Salary" && 
        exp.description?.includes("Manager Commission")
      );

      // Delete all commission expenses for this booking
      await Promise.all(
        commissionExpenses.map(expense => expenseService.deleteExpense(expense.id))
      );

      // Then delete the booking itself
      await bookingService.deleteBooking(bookingId);
      
      toast({ 
        title: "Booking Deleted", 
        description: commissionExpenses.length > 0 
          ? `Booking and ${commissionExpenses.length} associated commission expense(s) deleted.`
          : "The booking has been deleted successfully." 
      });
      
      await loadAllData();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({ title: "Error", description: "Failed to delete booking.", variant: "destructive" });
    }
  };

  const handleSaveExpense = async (expense: Omit<Expense, "id" | "created_at" | "updated_at">) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expense);
        toast({ title: "Expense Updated", description: "The expense has been updated successfully." });
      } else {
        await expenseService.createExpense(expense as ExpenseInsert);
        toast({ title: "Expense Created", description: "New expense has been recorded successfully." });
      }
      await loadAllData();
      setEditingExpense(undefined);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({ title: "Error", description: "Failed to save expense.", variant: "destructive" });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      toast({ title: "Expense Deleted", description: "The expense has been deleted successfully." });
      await loadAllData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
    }
  };

  const handleAddExpense = async (expense: ExpenseInsert) => {
    try {
      await expenseService.createExpense(expense);
      await loadAllData();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };
  
  const handleNavigateToExpenses = (bookingId: string) => {
    setFilteredBookingId(bookingId);
    setActiveTab("expenses");
  };

  // Combine regular expenses with manager expenses
  const allExpenses = [...expenses];

  const totalGuests = bookings.reduce((sum, b) => sum + b.number_of_guests, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_cost, 0);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const confirmedCount = bookings.filter(b => b.confirmed).length;
  const pendingCount = bookings.filter(b => !b.confirmed).length;

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
        <div className="container mx-auto px-4 py-4"><div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Trout Lake Resort</h1><p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Booking Management System</p></div><ThemeSwitch /></div></div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Bookings</CardTitle><div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{bookings.length}</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                <span className="text-green-600 dark:text-green-400 font-medium">{confirmedCount} Confirmed</span>
                {" • "}
                <span className="text-orange-600 dark:text-orange-400 font-medium">{pendingCount} Pending</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Guests</CardTitle><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div></CardHeader>
            <CardContent><div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalGuests}</div><p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Expected attendees</p></CardContent>
          </Card>
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Revenue</CardTitle><div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" /></div></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalRevenue.toLocaleString()}</div><p className="text-xs text-stone-600 dark:text-stone-400 mt-1">From all bookings</p></CardContent>
          </Card>
          <Card className={`bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Net Profit</CardTitle><div className={`p-2 ${netProfit >= 0 ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}><FileText className={`h-4 w-4 ${netProfit >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`} /></div></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? "text-cyan-600 dark:text-cyan-400" : "text-red-600 dark:text-red-400"}`}>${netProfit.toLocaleString()}</div><p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Revenue - Expenses</p></CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); if (value !== "expenses") setFilteredBookingId(undefined); }} className="space-y-6">
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
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100">All Bookings</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">Manage your Yom Tov, Shabaton, and Night Event bookings</CardDescription></div><Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all" onClick={() => { setEditingBooking(undefined); setBookingDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Booking</Button></div></CardHeader>
              <CardContent>{bookings.length === 0 ? <div className="text-center py-12 text-stone-500 dark:text-stone-400"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-lg font-medium mb-2">No bookings yet</p><p className="text-sm">Create your first booking to get started</p></div> : <BookingList key={refreshKey} bookings={bookings} onEdit={handleEditBooking} onDelete={handleDeleteBooking} onUpdateBooking={handleUpdateBooking} expenses={expenses} onNavigateToExpenses={handleNavigateToExpenses} />}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4"><BookingCalendar key={`calendar-${refreshKey}-${bookings.length}`} bookings={bookings} onBookingClick={handleEditBooking} onAddBooking={() => { setEditingBooking(undefined); setBookingDialogOpen(true); }} /></TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Invoice Management</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">View and manage all invoices for your bookings</CardDescription></div></div></CardHeader>
              <CardContent>{invoices.length === 0 ? <div className="text-center py-12"><FileText className="h-16 w-16 mx-auto mb-4 text-blue-300 dark:text-blue-700" /><h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">No Invoices Yet</h3><p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">Invoices are automatically generated when you confirm a booking. Create a confirmed booking to see your first invoice here.</p></div> : <div className="space-y-3">{invoices.map((invoice) => { const booking = bookings.find(b => b.id === invoice.booking_id); return (<div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{invoice.invoice_number}</span><Badge variant={invoice.balance_due > 0 ? "destructive" : "default"}>{invoice.balance_due > 0 ? "Outstanding" : "Paid"}</Badge></div><div className="text-sm text-stone-700 dark:text-stone-300"><p className="font-medium">{invoice.client_name}</p><p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{format(new Date(invoice.event_date_start), "MMM d")} - {format(new Date(invoice.event_date_end), "MMM d, yyyy")} • {invoice.number_of_guests} guests</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-lg font-bold text-stone-900 dark:text-stone-100">${Number(invoice.total_amount).toFixed(2)}</p>{invoice.balance_due > 0 && (<p className="text-xs text-orange-600 dark:text-orange-400">${Number(invoice.balance_due).toFixed(2)} due</p>)}</div><Button onClick={() => { if (booking) { setSelectedInvoiceBooking(booking); setInvoiceDialogOpen(true); } }} variant="outline" size="sm" className="flex items-center gap-2"><FileText className="h-4 w-4" />View Invoice</Button></div></div>); })}</div>}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4"><BudgetDashboard bookings={bookings} expenses={expenses} /></TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100">Expense Tracking</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">Record expenses with receipts and payment proof (includes manager compensation)</CardDescription></div><Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all" onClick={() => { setEditingExpense(undefined); setExpenseDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Expense</Button></div></CardHeader>
              <CardContent>{allExpenses.length === 0 ? <div className="text-center py-12 text-stone-500 dark:text-stone-400"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-lg font-medium mb-2">No expenses recorded</p><p className="text-sm">Start tracking your expenses with receipts</p></div> : <ExpenseList expenses={allExpenses} bookings={bookings} onEdit={handleEditExpense} onDelete={handleDeleteExpense} filterBookingId={filteredBookingId} />}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4"><ReceiptLibrary expenses={expenses} bookings={bookings} /></TabsContent>

          <TabsContent value="manager" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><CardTitle className="text-stone-900 dark:text-stone-100">Manager Compensation</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">Track maintenance fees, commissions, and payments to manager</CardDescription></CardHeader>
              <CardContent><ManagerSalary bookings={bookings} onAddExpense={handleAddExpense} allExpenses={expenses} onExpensesUpdate={loadAllData} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} onSave={handleSaveBooking} booking={editingBooking} bookings={bookings} />
      <ExpenseDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} onSave={handleSaveExpense} expense={editingExpense} bookings={bookings} />
      {selectedInvoiceBooking && <InvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} booking={selectedInvoiceBooking} />}
    </div>
  );
}
