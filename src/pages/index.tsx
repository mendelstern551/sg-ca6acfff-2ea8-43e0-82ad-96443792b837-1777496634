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
import { EmailHistory } from "@/components/EmailHistory";
import { TaskSidebar } from "@/components/TaskSidebar";
import { ReminderDialog } from "@/components/ReminderDialog";
import { reminderService } from "@/services/reminderService";
import { ReminderModal } from "@/components/ReminderModal";
import { CornerNotifications } from "@/components/CornerNotifications";
import { FeedbackDashboard } from "@/components/FeedbackDashboard";
import { TableFilters, SortOrder, DateFilter, StatusFilter } from "@/components/TableFilters";
import { QuickInsights, createInsight } from "@/components/QuickInsights";
import { getDateRange, isDateInRange, sortByDate, searchInFields, saveFilterPreferences, loadFilterPreferences } from "@/lib/filterUtils";
import { startOfDay, isAfter, isBefore, parseISO } from "date-fns";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

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

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderRefreshKey, setReminderRefreshKey] = useState(0);
  
  // 🔔 REMINDER SYSTEM STATE
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [minimizedReminders, setMinimizedReminders] = useState<Reminder[]>([]);
  const [currentReminder, setCurrentReminder] = useState<Reminder | undefined>();

  const { toast } = useToast();

  // 🔍 FILTER STATE - Bookings
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingSortOrder, setBookingSortOrder] = useState<SortOrder>("latest");
  const [bookingDateFilter, setBookingDateFilter] = useState<DateFilter>("all");
  const [bookingCustomRange, setBookingCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [bookingStatusFilter, setBookingStatusFilter] = useState<StatusFilter>("all");

  // 🔍 FILTER STATE - Invoices
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<SortOrder>("latest");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState<DateFilter>("all");
  const [invoiceCustomRange, setInvoiceCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // 🔍 FILTER STATE - Expenses
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseSortOrder, setExpenseSortOrder] = useState<SortOrder>("latest");
  const [expenseDateFilter, setExpenseDateFilter] = useState<DateFilter>("all");
  const [expenseCustomRange, setExpenseCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // 🔍 FILTER STATE - Emails
  const [emailSearch, setEmailSearch] = useState("");
  const [emailSortOrder, setEmailSortOrder] = useState<SortOrder>("latest");
  const [emailDateFilter, setEmailDateFilter] = useState<DateFilter>("all");
  const [emailCustomRange, setEmailCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const [bookingsFilter, setBookingsFilter] = useState("");
  const [invoicesFilter, setInvoicesFilter] = useState("");
  const [expensesFilter, setExpensesFilter] = useState("");
  const [emailsFilter, setEmailsFilter] = useState("");

  useEffect(() => {
    loadAllData();
    
    // ✅ DEBOUNCED SUBSCRIPTION: Only listen to critical tables + prevent rapid reloads
    let reloadTimeout: NodeJS.Timeout | null = null;
    
    const debouncedReload = () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        loadAllData();
      }, 500);
    };
    
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, debouncedReload)
      .subscribe();
    
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payments' 
      }, debouncedReload)
      .subscribe();
    
    const expensesChannel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'expenses' 
      }, debouncedReload)
      .subscribe();
    
    const invoicesChannel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invoices' 
      }, debouncedReload)
      .subscribe();
    
    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      bookingsChannel.unsubscribe();
      paymentsChannel.unsubscribe();
      expensesChannel.unsubscribe();
      invoicesChannel.unsubscribe();
    };
  }, []);

  // 🔔 AUTO-CHECK FOR DUE REMINDERS (Every minute)
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const [due, minimized] = await Promise.all([
          reminderService.getDueReminders(),
          reminderService.getMinimizedReminders()
        ]);
        
        setDueReminders(due);
        setMinimizedReminders(minimized);
        
        // Show center modal for first due reminder
        if (due.length > 0 && !currentReminder) {
          setCurrentReminder(due[0]);
        }
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminderRefreshKey, currentReminder]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled([
        bookingService.getAllBookings(),
        expenseService.getAllExpenses(),
        invoiceService.getAllInvoices(),
        managerService.getAllCompensation()
      ]);

      const bookingsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const expensesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const invoicesData = results[2].status === 'fulfilled' ? results[2].value : [];
      const managerData = results[3].status === 'fulfilled' ? results[3].value : [];

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

  // 🔔 REMINDER HANDLER FUNCTIONS (Inside component)
  const handleCompleteReminder = async () => {
    if (!currentReminder) return;
    
    try {
      await reminderService.completeReminder(currentReminder.id);
      toast({
        title: "✅ Task Completed",
        description: "Great job! Task marked as complete.",
      });
      
      // Clear center modal first
      setCurrentReminder(undefined);
      // Force refresh of all reminder states
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders to update corner notifications immediately
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleSnoozeReminder = async (minutes: number) => {
    if (!currentReminder) return;
    
    try {
      await reminderService.snoozeReminder(currentReminder.id, minutes);
      toast({
        title: "⏰ Task Snoozed",
        description: `Reminder will reappear in ${minutes} minutes`,
      });
      
      // Clear center modal first
      setCurrentReminder(undefined);
      // Force refresh of all reminder states
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders to update corner notifications immediately
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze task",
        variant: "destructive"
      });
    }
  };

  const handleSnoozeMinimize = async (minutes: number) => {
    if (!currentReminder) return;
    
    try {
      await reminderService.snoozeMinimize(currentReminder.id, minutes);
      toast({
        title: "📌 Task Minimized",
        description: `Moved to corner. Will remind again in ${minutes} minutes.`,
      });
      
      // Clear center modal first
      setCurrentReminder(undefined);
      // Force refresh of all reminder states
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders to update corner notifications immediately
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error snoozing and minimizing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to minimize task",
        variant: "destructive"
      });
    }
  };

  const handleDismissReminder = async () => {
    if (!currentReminder) return;
    
    try {
      await reminderService.dismissReminder(currentReminder.id);
      toast({
        title: "Task Dismissed",
        description: "Reminder has been dismissed",
      });
      
      // Clear center modal first
      setCurrentReminder(undefined);
      // Force refresh of all reminder states
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders to update corner notifications immediately
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss task",
        variant: "destructive"
      });
    }
  };

  const handleCompleteMinimized = async (reminderId: string) => {
    try {
      await reminderService.completeReminder(reminderId);
      toast({
        title: "✅ Task Completed",
        description: "Task marked as complete",
      });
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error completing minimized reminder:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleDismissMinimized = async (reminderId: string) => {
    try {
      await reminderService.dismissReminder(reminderId);
      toast({
        title: "Task Dismissed",
        description: "Reminder dismissed",
      });
      setReminderRefreshKey(prev => prev + 1);
      
      // Manually refresh reminders
      const [due, minimized] = await Promise.all([
        reminderService.getDueReminders(),
        reminderService.getMinimizedReminders()
      ]);
      setDueReminders(due);
      setMinimizedReminders(minimized);
    } catch (error) {
      console.error("Error dismissing minimized reminder:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss task",
        variant: "destructive"
      });
    }
  };

  const handleExpandMinimized = (reminder: Reminder) => {
    setCurrentReminder(reminder);
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, "id" | "created_at" | "updated_at" | "payments">) => {
    try {
      const amountPaid = editingBooking?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const balanceDue = bookingData.total_cost - amountPaid;

      let paymentStatus: "pending" | "partial" | "paid" = "pending";
      if (balanceDue <= 0) paymentStatus = "paid";
      else if (amountPaid > 0) paymentStatus = "partial";
      
      // Remove building_id and recurring to avoid schema cache issues
      const { building_id, recurring, ...cleanBookingData } = bookingData as any;
      
      const dataToSave: Omit<Booking, "id" | "created_at" | "updated_at" | "payments"> & { amount_paid: number, balance_due: number, payment_status: any } = {
          ...cleanBookingData,
          amount_paid: amountPaid,
          balance_due: balanceDue,
          payment_status: paymentStatus
      };

      let savedBookingId: string;
      const isNewBooking = !editingBooking;

      if (editingBooking) {
        await bookingService.updateBooking(editingBooking.id, dataToSave as BookingUpdate);
        savedBookingId = editingBooking.id;
        toast({ title: "Booking Updated", description: `Balance due recalculated: ${formatCurrency(balanceDue)}` });
      } else {
        const newBooking = await bookingService.createBooking(dataToSave as BookingInsert);
        savedBookingId = newBooking.id;
        toast({ title: "Booking Created", description: "New booking has been created successfully." });
      }

      // Auto-generate or refresh reminders for BOTH pending and confirmed bookings
      try {
        const significantChange = isNewBooking
          || editingBooking?.confirmed !== bookingData.confirmed
          || editingBooking?.start_date !== bookingData.start_date
          || editingBooking?.name !== bookingData.name
          || editingBooking?.contact_name !== bookingData.contact_name;

        if (significantChange) {
          // Remove previous auto-generated reminders for this booking to avoid duplicates
          await reminderService.deleteBookingReminders(savedBookingId);
          // Create fresh reminders based on current status and dates
          await reminderService.generateBookingReminders(savedBookingId, {
            eventName: bookingData.name,
            contactName: bookingData.contact_name,
            startDate: new Date(bookingData.start_date),
            isPending: !bookingData.confirmed
          });
          setReminderRefreshKey(prev => prev + 1);
        }
      } catch (reminderError) {
        console.error("Error creating reminders:", reminderError);
      }

      // Invoice generation only for confirmed bookings
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
      const commissionExpenses = expenses.filter(
        exp => exp.booking_id === bookingId && 
        exp.category === "Manager Salary" && 
        exp.description?.includes("Manager Commission")
      );

      await Promise.all(
        commissionExpenses.map(expense => expenseService.deleteExpense(expense.id))
      );

      try {
        await reminderService.deleteBookingReminders(bookingId);
      } catch (reminderError) {
        console.error("Error deleting reminders:", reminderError);
      }

      await bookingService.deleteBooking(bookingId);
      
      toast({ 
        title: "Booking Deleted", 
        description: commissionExpenses.length > 0 
          ? `Booking and ${commissionExpenses.length} associated commission expense(s) deleted.`
          : "The booking has been deleted successfully." 
      });
      
      await loadAllData();
      setReminderRefreshKey(prev => prev + 1);
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

  const allExpenses = [...expenses];

  const totalGuests = bookings.reduce((sum, b) => sum + b.number_of_guests, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_cost, 0);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const confirmedCount = bookings.filter(b => b.confirmed).length;
  const pendingCount = bookings.filter(b => !b.confirmed).length;

  // 🔍 APPLY FILTERS - Bookings
  let filteredBookings = bookings;
  
  // Search
  if (bookingSearch) {
    filteredBookings = filteredBookings.filter(b =>
      searchInFields(b, bookingSearch, ["name", "contact_name", "contact_email", "notes"])
    );
  }
  
  // Date filter
  const bookingDateRange = getDateRange(bookingDateFilter, bookingCustomRange);
  if (bookingDateRange.from || bookingDateRange.to) {
    filteredBookings = filteredBookings.filter(b =>
      isDateInRange(b.start_date, bookingDateRange)
    );
  }
  
  // Status filter
  if (bookingStatusFilter !== "all") {
    const now = new Date();
    filteredBookings = filteredBookings.filter(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      
      if (bookingStatusFilter === "upcoming") return isAfter(start, now) && b.confirmed;
      if (bookingStatusFilter === "past") return isBefore(end, now);
      if (bookingStatusFilter === "ongoing") return isBefore(start, now) && isAfter(end, now);
      if (bookingStatusFilter === "cancelled") return !b.confirmed;
      return true;
    });
  }
  
  // Sort
  filteredBookings = sortByDate(filteredBookings, b => b.start_date, bookingSortOrder);

  // 🔍 APPLY FILTERS - Invoices
  let filteredInvoices = invoices;
  
  if (invoiceSearch) {
    filteredInvoices = filteredInvoices.filter(inv => {
      const booking = bookings.find(b => b.id === inv.booking_id);
      return searchInFields(inv, invoiceSearch, ["invoice_number", "client_name", "client_email"]) ||
        (booking && searchInFields(booking, invoiceSearch, ["name"]));
    });
  }
  
  const invoiceDateRange = getDateRange(invoiceDateFilter, invoiceCustomRange);
  if (invoiceDateRange.from || invoiceDateRange.to) {
    filteredInvoices = filteredInvoices.filter(inv =>
      isDateInRange(inv.event_date_start, invoiceDateRange)
    );
  }
  
  filteredInvoices = sortByDate(filteredInvoices, inv => inv.created_at, invoiceSortOrder);

  // 🔍 APPLY FILTERS - Expenses
  let filteredExpenses = allExpenses;
  
  if (expenseSearch) {
    filteredExpenses = filteredExpenses.filter(exp => {
      const booking = bookings.find(b => b.id === exp.booking_id);
      return searchInFields(exp, expenseSearch, ["category", "description", "vendor"]) ||
        (booking && searchInFields(booking, expenseSearch, ["name", "contact_name"]));
    });
  }
  
  const expenseDateRange = getDateRange(expenseDateFilter, expenseCustomRange);
  if (expenseDateRange.from || expenseDateRange.to) {
    filteredExpenses = filteredExpenses.filter(exp =>
      isDateInRange(exp.expense_date, expenseDateRange)
    );
  }
  
  filteredExpenses = sortByDate(filteredExpenses, exp => exp.expense_date, expenseSortOrder);

  // 🔍 APPLY FILTERS - Emails
  // Note: EmailHistory component fetches its own data, but we can pass filter props to it
  // or wrap it to filter the displayed data if it accepts data as props.
  // Looking at EmailHistory usage: <EmailHistory bookings={...} />
  // It seems EmailHistory manages its own fetching. 
  // For now, I'll pass the filter props to EmailHistory and let it handle or filter if possible.
  // Actually, better approach: The EmailHistory component likely fetches data internally.
  // I should check EmailHistory.tsx to see if I can lift the state or pass filters.
  
  // Let's modify EmailHistory to accept filter props or handle filtering internally.
  // For this step, I will just add the filter controls to the Email tab wrapper in the next step.

  // 🎯 QUICK INSIGHTS CALCULATIONS
  const upcomingBookings = bookings
    .filter(b => b.confirmed && isAfter(new Date(b.start_date), new Date()))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  const nextEvent = upcomingBookings[0];
  
  const latestInvoice = [...invoices].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  
  const recentActivity = bookings
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0];

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
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Net Profit</CardTitle><div className={`p-2 ${netProfit >= 0 ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}><FileText className={`h-4 w-4 ${netProfit >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`} /></div></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? "text-cyan-600 dark:text-cyan-400" : "text-red-600 dark:text-red-400"}`}>${netProfit.toLocaleString()}</div><p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Revenue - Expenses</p></CardContent>
          </Card>
        </div>

        <QuickInsights
          insights={[
            createInsight(
              <Calendar className="h-5 w-5" />,
              "Next Event",
              nextEvent ? format(new Date(nextEvent.start_date), "MMM dd, yyyy") : "No upcoming events",
              nextEvent ? `${nextEvent.name} • ${nextEvent.contact_name}` : undefined
            ),
            createInsight(
              <FileText className="h-5 w-5" />,
              "Latest Invoice",
              latestInvoice ? latestInvoice.invoice_number : "No invoices",
              latestInvoice ? `${latestInvoice.client_name} • $${Number(latestInvoice.total_amount).toFixed(2)}` : undefined
            ),
            createInsight(
              <DollarSign className="h-5 w-5" />,
              "Recent Activity",
              recentActivity ? recentActivity.name : "No activity",
              recentActivity ? format(new Date(recentActivity.updated_at || recentActivity.created_at), "MMM dd 'at' h:mm a") : undefined
            ),
            createInsight(
              <Users className="h-5 w-5" />,
              "Total Guests (All Time)",
              totalGuests.toString(),
              `Across ${bookings.length} bookings`
            ),
          ]}
        />

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); if (value !== "expenses") setFilteredBookingId(undefined); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-[1200px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="emails">Email History</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100">All Bookings</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">Manage your Yom Tov, Shabaton, and Night Event bookings</CardDescription></div><Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all" onClick={() => { setEditingBooking(undefined); setBookingDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Booking</Button></div></CardHeader>
              <CardContent>
                <TableFilters
                  searchValue={bookingSearch}
                  onSearchChange={setBookingSearch}
                  searchPlaceholder="Search bookings, clients, emails..."
                  sortOrder={bookingSortOrder}
                  onSortOrderChange={setBookingSortOrder}
                  dateFilter={bookingDateFilter}
                  onDateFilterChange={setBookingDateFilter}
                  customDateRange={bookingCustomRange}
                  onCustomDateRangeChange={setBookingCustomRange}
                  statusFilter={bookingStatusFilter}
                  onStatusFilterChange={setBookingStatusFilter}
                  showStatusFilter={true}
                  statusLabel="Status"
                />
                
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No bookings found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <BookingList 
                    key={refreshKey} 
                    bookings={filteredBookings} 
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

          <TabsContent value="calendar" className="space-y-4"><BookingCalendar key={`calendar-${refreshKey}-${bookings.length}`} bookings={bookings} onBookingClick={handleEditBooking} onAddBooking={() => { setEditingBooking(undefined); setBookingDialogOpen(true); }} /></TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Invoice Management</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">View and manage all invoices for your bookings</CardDescription></div></div></CardHeader>
              <CardContent>{filteredInvoices.length === 0 ? <div className="text-center py-12"><FileText className="h-16 w-16 mx-auto mb-4 text-blue-300 dark:text-blue-700" /><h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">No Invoices Found</h3><p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">Try adjusting your search or filters</p></div> : <div className="space-y-3">{filteredInvoices.map((invoice) => { const booking = bookings.find(b => b.id === invoice.booking_id); return (<div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{invoice.invoice_number}</span><Badge variant={invoice.balance_due > 0 ? "destructive" : "default"}>{invoice.balance_due > 0 ? "Outstanding" : "Paid"}</Badge></div><div className="text-sm text-stone-700 dark:text-stone-300"><p className="font-medium">{invoice.client_name}</p><p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{format(new Date(invoice.event_date_start), "MMM d")} - {format(new Date(invoice.event_date_end), "MMM d, yyyy")} • {invoice.number_of_guests} guests</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-lg font-bold text-stone-900 dark:text-stone-100">${Number(invoice.total_amount).toFixed(2)}</p>{invoice.balance_due > 0 && (<p className="text-xs text-orange-600 dark:text-orange-400">${Number(invoice.balance_due).toFixed(2)} due</p>)}</div><Button onClick={() => { if (booking) { setSelectedInvoiceBooking(booking); setInvoiceDialogOpen(true); } }} variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />View</Button></div></div>); })}</div>}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget"><BudgetDashboard bookings={bookings} expenses={expenses} /></TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-stone-900 dark:text-stone-100">Expense Tracking</CardTitle><CardDescription className="text-stone-600 dark:text-stone-400">Record expenses with receipts</CardDescription></div><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setEditingExpense(undefined); setExpenseDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Expense</Button></div></CardHeader>
              <CardContent>
                <TableFilters
                  searchValue={expenseSearch}
                  onSearchChange={setExpenseSearch}
                  searchPlaceholder="Search expenses, categories, vendors..."
                  sortOrder={expenseSortOrder}
                  onSortOrderChange={setExpenseSortOrder}
                  dateFilter={expenseDateFilter}
                  onDateFilterChange={setExpenseDateFilter}
                  customDateRange={expenseCustomRange}
                  onCustomDateRangeChange={setExpenseCustomRange}
                />
                
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No expenses found</p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <ExpenseList 
                    expenses={filteredExpenses} 
                    bookings={bookings} 
                    onEdit={handleEditExpense} 
                    onDelete={handleDeleteExpense} 
                    filterBookingId={filteredBookingId} 
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts"><ReceiptLibrary expenses={expenses} bookings={bookings} /></TabsContent>

          <TabsContent value="manager">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader><CardTitle>Manager Compensation</CardTitle></CardHeader>
              <CardContent><ManagerSalary bookings={bookings} onAddExpense={handleAddExpense} allExpenses={expenses} onExpensesUpdate={loadAllData} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails"><EmailHistory bookings={bookings.map(b => ({ id: b.id, name: b.name, contact_name: b.contact_name }))} /></TabsContent>

          <TabsContent value="feedback">
            <FeedbackDashboard 
              bookings={bookings} 
              onSendFeedbackRequest={async (booking) => {
                try {
                  const response = await fetch("/api/send-feedback-request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      bookingId: booking.id,
                      contactName: booking.contact_name,
                      contactEmail: booking.contact_email,
                      eventName: booking.name,
                      checkOutDate: booking.end_date
                    }),
                  });

                  const result = await response.json();
                  
                  if (response.ok) {
                    toast({
                      title: "✅ Feedback Request Sent",
                      description: `Email sent successfully to ${booking.contact_email}`,
                    });
                    await loadAllData();
                  } else {
                    toast({
                      title: "❌ Failed to Send",
                      description: result.error || "Failed to send feedback request",
                      variant: "destructive"
                    });
                  }
                } catch (error) {
                  console.error("Error sending feedback request:", error);
                  toast({
                    title: "Error",
                    description: "Failed to send feedback request email",
                    variant: "destructive"
                  });
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <TaskSidebar onCreateReminder={() => setReminderDialogOpen(true)} refreshTrigger={reminderRefreshKey} />

      {currentReminder && (
        <ReminderModal
          reminder={currentReminder}
          onComplete={handleCompleteReminder}
          onSnooze={handleSnoozeReminder}
          onSnoozeMinimize={handleSnoozeMinimize}
          onDismiss={handleDismissReminder}
        />
      )}

      <CornerNotifications
        reminders={minimizedReminders}
        onComplete={handleCompleteMinimized}
        onDismiss={handleDismissMinimized}
        onExpand={handleExpandMinimized}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        onSuccess={() => setReminderRefreshKey(prev => prev + 1)}
        bookings={bookings.map(b => ({ id: b.id, name: b.name, contact_name: b.contact_name }))}
      />

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} onSave={handleSaveBooking} booking={editingBooking} bookings={bookings} />
      <ExpenseDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} onSave={handleSaveExpense} expense={editingExpense} bookings={bookings} />
      {selectedInvoiceBooking && <InvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} booking={selectedInvoiceBooking} />}
    </div>
  );
}
