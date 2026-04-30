import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Calendar, Users, DollarSign, FileText, Plus, Home, Receipt, Briefcase, Mail, MessageSquare, TrendingUp, BarChart3, Wrench, LayoutDashboard, Clock, AlertCircle, CheckCircle2, Search, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { invoiceService, type InvoiceWithDetails } from "@/services/invoiceService";
import { paymentService, Payment } from "@/services/paymentService";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { format, isAfter, isBefore } from "date-fns";
import { managerService } from "@/services/managerService";
import type { ManagerCompensation } from "@/services/managerService";
import { EmailHistory } from "@/components/EmailHistory";
import { TaskSidebar } from "@/components/TaskSidebar";
import { ReminderDialog } from "@/components/ReminderDialog";
import { reminderService } from "@/services/reminderService";
import { clientCommunicationService } from "@/services/clientCommunicationService";
import { ReminderModal } from "@/components/ReminderModal";
import { CornerNotifications } from "@/components/CornerNotifications";
import { FeedbackDashboard } from "@/components/FeedbackDashboard";
import { TableFilters, SortOrder, DateFilter, StatusFilter } from "@/components/TableFilters";
import { ClientCommunications } from "@/components/ClientCommunications";
import { EventMargin } from "@/components/EventMargin";
import { EmptyState } from "@/components/EmptyState";
import { ClientDetailsDialog } from "@/components/ClientDetailsDialog";
import { PricingSettings } from "@/components/PricingSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DEFAULT_EVENT_MARGIN_CONFIG, type EventMarginConfig } from "@/types/eventMargin";
import { useAppSetting } from "@/lib/settingsStore";
import { getDateRange, isDateInRange, sortByDate, searchInFields } from "@/lib/filterUtils";
import { startOfDay } from "date-fns";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [viewBookingOpen, setViewBookingOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sync tab with URL ?tab= so the command palette and shareable links work.
  useEffect(() => {
    if (!router.isReady) return;
    const t = typeof router.query.tab === "string" ? router.query.tab : null;
    if (t && t !== activeTab) setActiveTab(t);
    // We intentionally don't include activeTab in deps — we only react to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tab]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [managerCompensations, setManagerCompensations] = useState<ManagerCompensation[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filteredBookingId, setFilteredBookingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [savingBooking, setSavingBooking] = useState(false);

  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | undefined>();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderRefreshKey, setReminderRefreshKey] = useState(0);
  
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [minimizedReminders, setMinimizedReminders] = useState<Reminder[]>([]);
  const [currentReminder, setCurrentReminder] = useState<Reminder | undefined>();

  const { toast } = useToast();

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingSortOrder, setBookingSortOrder] = useState<SortOrder>("latest");
  const [bookingDateFilter, setBookingDateFilter] = useState<DateFilter>("all");
  const [bookingCustomRange, setBookingCustomRange] = useState<{ from?: Date; to?: Date }>({});
  // Default to "all" so the tab opens with every booking visible, latest-first.
  const [bookingStatusFilter, setBookingStatusFilter] = useState<StatusFilter>("all");

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<SortOrder>("latest");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState<DateFilter>("all");
  const [invoiceCustomRange, setInvoiceCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseSortOrder, setExpenseSortOrder] = useState<SortOrder>("latest");
  const [expenseDateFilter, setExpenseDateFilter] = useState<DateFilter>("all");
  const [expenseCustomRange, setExpenseCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // Open booking edit when ?focus=<id>&action=edit arrives (e.g., from command palette).
  useEffect(() => {
    if (!router.isReady) return;
    const focus = typeof router.query.focus === "string" ? router.query.focus : null;
    const action = typeof router.query.action === "string" ? router.query.action : null;
    if (focus && action === "edit" && bookings.length > 0) {
      const target = bookings.find((b) => b.id === focus);
      if (target) {
        setEditingBooking(target);
        setBookingDialogOpen(true);
        // Strip the URL flags so reopening doesn't keep firing.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { focus: _f, action: _a, ...rest } = router.query;
        router.replace({ pathname: "/", query: rest }, undefined, { shallow: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.focus, router.query.action, bookings.length]);

  // Listen for command-palette dialog events:
  //   - dialog:add-payment   — opens PaymentDialog for the given booking
  //   - dialog:view-booking  — opens read-only ClientDetailsDialog (does NOT switch tabs)
  useEffect(() => {
    const onAddPayment = (e: Event) => {
      const detail = (e as CustomEvent<{ bookingId: string }>).detail;
      if (!detail?.bookingId) return;
      const target = bookings.find((b) => b.id === detail.bookingId);
      if (target) {
        setPaymentBooking(target);
        setEditingPayment(undefined);
        setPaymentDialogOpen(true);
      }
    };
    const onViewBooking = (e: Event) => {
      const detail = (e as CustomEvent<{ bookingId: string }>).detail;
      if (!detail?.bookingId) return;
      const target = bookings.find((b) => b.id === detail.bookingId);
      if (target) {
        setViewBooking(target);
        setViewBookingOpen(true);
      }
    };
    const onEditPayment = (e: Event) => {
      const detail = (e as CustomEvent<{ bookingId: string; payment: Payment }>).detail;
      if (!detail?.bookingId || !detail?.payment) return;
      const target = bookings.find((b) => b.id === detail.bookingId);
      if (target) {
        setPaymentBooking(target);
        setEditingPayment(detail.payment);
        setPaymentDialogOpen(true);
      }
    };
    window.addEventListener("dialog:add-payment", onAddPayment);
    window.addEventListener("dialog:view-booking", onViewBooking);
    window.addEventListener("dialog:edit-payment", onEditPayment);
    return () => {
      window.removeEventListener("dialog:add-payment", onAddPayment);
      window.removeEventListener("dialog:view-booking", onViewBooking);
      window.removeEventListener("dialog:edit-payment", onEditPayment);
    };
  }, [bookings]);

  useEffect(() => {
    loadAllData();
    
    // ✅ FIX #1: Disable realtime subscriptions temporarily to prevent freezing
    // The issue is that rapid database changes trigger multiple reloads
    // We'll rely on manual refreshes after save operations instead
    
    /* DISABLED REALTIME SUBSCRIPTIONS - CAUSING FREEZING
    let reloadTimeout: NodeJS.Timeout | null = null;
    let isReloading = false;
    
    const debouncedReload = () => {
      if (isReloading) return;
      if (reloadTimeout) clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        isReloading = true;
        loadAllData().finally(() => {
          isReloading = false;
        });
      }, 2000);
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
    */
  }, []);

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const [due, minimized] = await Promise.all([
          reminderService.getDueReminders(),
          reminderService.getMinimizedReminders()
        ]);
        
        setDueReminders(due);
        setMinimizedReminders(minimized);
        
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

      const bookingsData = results[0].status === "fulfilled" ? results[0].value : [];
      const expensesData = results[1].status === "fulfilled" ? results[1].value : [];
      const invoicesData = results[2].status === "fulfilled" ? results[2].value : [];
      const managerData = results[3].status === "fulfilled" ? results[3].value : [];

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const serviceName = ["Bookings", "Expenses", "Invoices", "Manager"][index];
          console.error(`${serviceName} service error:`, result.reason);
        }
      });

      const bookingsWithPayments = bookingsData.map((b) => ({
        ...b,
        payments: b.payments || [],
      }));

      setBookings(bookingsWithPayments);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setManagerCompensations(managerData);

      if (results[0].status === "rejected" || results[1].status === "rejected") {
        toast({
          title: "Partial Load Failure",
          description: "Some data couldn't be loaded. Retrying automatically...",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load data. The app will retry automatically every 30 seconds.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReminder = async () => {
    if (!currentReminder) return;
    
    try {
      await reminderService.completeReminder(currentReminder.id);
      toast({
        title: "✅ Task Completed",
        description: "Great job! Task marked as complete.",
      });
      
      setCurrentReminder(undefined);
      setReminderRefreshKey(prev => prev + 1);
      
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
      
      setCurrentReminder(undefined);
      setReminderRefreshKey(prev => prev + 1);
      
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
      
      setCurrentReminder(undefined);
      setReminderRefreshKey(prev => prev + 1);
      
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
      
      setCurrentReminder(undefined);
      setReminderRefreshKey(prev => prev + 1);
      
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
    if (savingBooking) return;

    setSavingBooking(true);

    const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    try {
      const existingPaymentsTotal = editingBooking?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const balanceDue = bookingData.total_cost - existingPaymentsTotal;

      let paymentStatus: "pending" | "partial" | "paid" = "pending";
      if (balanceDue <= 0) paymentStatus = "paid";
      else if (existingPaymentsTotal > 0) paymentStatus = "partial";

      const { building_id, recurring, ...cleanBookingData } = bookingData as unknown as {
        building_id?: unknown;
        recurring?: unknown;
      };

      const dataToSave: Omit<Booking, "id" | "created_at" | "updated_at" | "payments"> & {
        amount_paid: number;
        balance_due: number;
        payment_status: "pending" | "partial" | "paid";
      } = {
        ...(cleanBookingData as any),
        amount_paid: existingPaymentsTotal,
        balance_due: balanceDue,
        payment_status: paymentStatus,
      };

      let savedBookingId: string;
      const isNewBooking = !editingBooking;

      if (editingBooking) {
        await withTimeout(
          bookingService.updateBooking(editingBooking.id, dataToSave as BookingUpdate),
          15000,
          "Update booking"
        );
        savedBookingId = editingBooking.id;
        toast({
          title: "Booking Updated",
          description: `Balance due recalculated: ${formatCurrency(balanceDue)}`,
        });
      } else {
        const newBooking = await withTimeout(
          bookingService.createBooking(dataToSave as BookingInsert),
          15000,
          "Create booking"
        );
        savedBookingId = newBooking.id;
        toast({
          title: "Booking Created",
          description: "New booking has been created successfully.",
        });

        // Auto-schedule the standard pre-event email sequence (website info + parking).
        // Fire-and-forget — never blocks booking creation.
        clientCommunicationService
          .scheduleAutoEmailsForBooking({
            id: newBooking.id,
            name: newBooking.name,
            start_date: newBooking.start_date,
            contact_email: newBooking.contact_email,
            contact_name: newBooking.contact_name,
          })
          .then((result) => {
            if (result.scheduled > 0) {
              toast({
                title: "Emails scheduled",
                description: `${result.scheduled} pre-event email${result.scheduled > 1 ? "s" : ""} queued (website info + parking).`,
              });
            } else if (result.reason && result.reason !== "already scheduled") {
              console.warn("Auto-schedule skipped:", result.reason);
            }
          });
      }

      try {
        const significantChange =
          isNewBooking ||
          editingBooking?.confirmed !== bookingData.confirmed ||
          editingBooking?.start_date !== bookingData.start_date ||
          editingBooking?.name !== bookingData.name ||
          editingBooking?.contact_name !== bookingData.contact_name;

        if (significantChange) {
          await reminderService.deleteBookingReminders(savedBookingId);
          await reminderService.generateBookingReminders(savedBookingId, {
            eventName: bookingData.name,
            contactName: bookingData.contact_name,
            startDate: new Date(bookingData.start_date),
            isPending: !bookingData.confirmed,
          });
          setReminderRefreshKey((prev) => prev + 1);
        }
      } catch (reminderError) {
        console.error("Reminder generation failed (booking still saved):", reminderError);
      }

      if (bookingData.confirmed) {
        try {
          const existingInvoice = await withTimeout(
            invoiceService.getInvoiceByBookingId(savedBookingId),
            15000,
            "Check invoice"
          );

          if (!existingInvoice) {
            const invoiceResult = await withTimeout(
              invoiceService.createInvoice(savedBookingId, {
                clientName: bookingData.contact_name,
                clientEmail: bookingData.contact_email || undefined,
                clientPhone: bookingData.contact_phone || undefined,
                check_in: bookingData.start_date,
                check_out: bookingData.end_date,
                total_cost: bookingData.total_cost,
                deposit_paid: existingPaymentsTotal,
                number_of_guests: bookingData.number_of_guests ?? 0,
                number_of_rooms: bookingData.number_of_rooms ?? 0,
                base_price: bookingData.base_rate ?? undefined,
                notes: bookingData.notes ?? undefined
              }),
              15000,
              "Create invoice"
            );

            toast({
              title: "✓ Invoice Generated",
              description: `Invoice ${invoiceResult.invoice_number || ""} created successfully.`,
              variant: "default",
            });
          }
        } catch (invoiceError: any) {
          console.error("Invoice creation failed:", invoiceError);
          toast({
            title: "Invoice Creation Failed",
            description: invoiceError?.message || "Booking saved, but invoice creation failed.",
            variant: "destructive",
          });
        }
      }

      await withTimeout(loadAllData(), 20000, "Reload data");
      setEditingBooking(undefined);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Booking save failed (raw):", error);
      const message =
        error?.message ||
        error?.details ||
        error?.hint ||
        "Failed to save booking. Please try again.";

      toast({
        title: "Booking Save Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingBooking(false);
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

  const handleEditPayment = (booking: Booking, payment: Payment) => {
    setEditingPayment(payment);
    setPaymentBooking(booking);
    setPaymentDialogOpen(true);
  };

  const handleDeletePayment = async (paymentId: string, bookingId: string) => {
    try {
      await paymentService.deletePayment(paymentId);
      toast({ title: "Payment Deleted", description: "The payment has been deleted successfully." });
      await loadAllData();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
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

  // Live EventMargin config — synced via Supabase app_settings (with localStorage mirror).
  const marginConfig = useAppSetting<EventMarginConfig>("event-margin", DEFAULT_EVENT_MARGIN_CONFIG);

  // Per-event variable cost for each booking, using the user's margin model:
  //   manager commission (15% min $1k) + per-event line items + booking-tracked expenses
  const perEventLineSum = (marginConfig.perEventExpenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const computedBookingExpenses = bookings.reduce((sum, b) => {
    const commission = Math.max(
      (Number(b.total_cost) || 0) * (marginConfig.manager.commissionPercent / 100),
      marginConfig.manager.minimumCommissionPerEvent
    );
    return sum + commission + perEventLineSum;
  }, 0);
  // Fixed annual costs (hydro, snow, marketing, building yearly)
  const fixedAnnualCosts =
    (marginConfig.annualExpenses || []).reduce((s, e) => s + (Number(e.yearlyAmount) || 0), 0) +
    (marginConfig.buildings || []).reduce((s, b) => s + (Number(b.yearlyCost) || 0), 0);
  // Plus any expenses already logged in the DB (food, ad-hoc, manager payments etc.)
  // Exclude DB expenses in the "Manager Salary" category — those are auto-created
  // by ManagerSalary's commission/maintenance generator and are already represented
  // in computedBookingExpenses.commission. Counting them again double-bills.
  const dbExpensesSum = allExpenses.reduce((sum, e) =>
    e.category === "Manager Salary" ? sum : sum + Number(e.amount), 0
  );

  const totalExpenses = computedBookingExpenses + fixedAnnualCosts + dbExpensesSum;
  const netProfit = totalRevenue - totalExpenses;

  const confirmedCount = bookings.filter(b => b.confirmed).length;
  const pendingCount = bookings.filter(b => !b.confirmed).length;

  const now = new Date();
  const upcomingBookings = bookings
    .filter(b => b.confirmed && isAfter(new Date(b.start_date), now))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const nextEvent = upcomingBookings[0];

  const pendingInvoices = invoices.filter(inv => inv.balance_due > 0);
  const outstandingBalance = pendingInvoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);

  let filteredBookings = bookings;
  
  if (bookingSearch) {
    filteredBookings = filteredBookings.filter(b =>
      searchInFields(b, bookingSearch, ["name", "contact_name", "contact_email", "contact_phone", "notes"])
    );
  }
  
  const bookingDateRange = getDateRange(bookingDateFilter, bookingCustomRange);
  if (bookingDateRange.from || bookingDateRange.to) {
    filteredBookings = filteredBookings.filter(b =>
      isDateInRange(b.start_date, bookingDateRange)
    );
  }
  
  if (bookingStatusFilter !== "all") {
    filteredBookings = filteredBookings.filter(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      
      if (bookingStatusFilter === "upcoming") return !isBefore(end, now); // present + future, regardless of confirm status
      if (bookingStatusFilter === "past") return isBefore(end, now);
      if (bookingStatusFilter === "ongoing") return isBefore(start, now) && isAfter(end, now);
      if (bookingStatusFilter === "cancelled") return !b.confirmed;
      return true;
    });
  }
  
  filteredBookings = sortByDate(filteredBookings, b => b.start_date, bookingSortOrder);

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

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "calendar", label: "Calendar", icon: Home },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "budget", label: "Budget", icon: BarChart3 },
    { id: "expenses", label: "Expenses", icon: DollarSign },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "manager", label: "Manager", icon: Briefcase },
    { id: "margin", label: "Event Margin", icon: TrendingUp },
    { id: "communications", label: "Communications", icon: Mail },
    { id: "emails", label: "Email History", icon: MessageSquare },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Shared nav body — used both in the desktop sidebar and the mobile/tablet drawer.
  const navBody = (
    <nav className="p-4 space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (item.id !== "expenses") setFilteredBookingId(undefined);
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* MOBILE / TABLET TOP BAR — scrolls with the page (no sticky) so it doesn't
          eat vertical space on tablet. Hamburger remains accessible from the top. */}
      <header className="lg:hidden bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <SheetTitle className="text-left">Trout Lake Resort</SheetTitle>
                </SheetHeader>
                {navBody}
              </SheetContent>
            </Sheet>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              Trout Lake Resort
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => window.dispatchEvent(new CustomEvent("palette:open"))}
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* DESKTOP SIDEBAR — hidden below lg */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-screen overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Trout Lake Resort</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Management System</p>
            </div>
            <ThemeToggle />
          </div>
          {navBody}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
              <ThemeSwitch />
            </div>
          </div>
        </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64">
        {/* DASHBOARD HEADER - Only show on dashboard tab */}
        {activeTab === "dashboard" && (
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="px-8 py-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Next Event</CardTitle>
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {nextEvent ? (
                      <>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{format(new Date(nextEvent.start_date), "MMM d, yyyy")}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 truncate">{nextEvent.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{nextEvent.contact_name}</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">No Events</div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">No upcoming confirmed bookings</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Total Revenue</CardTitle>
                    <div className="p-2 bg-emerald-600 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">From all bookings</p>
                  </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800' : 'from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800'}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${netProfit >= 0 ? 'text-cyan-900 dark:text-cyan-100' : 'text-red-900 dark:text-red-100'}`}>Net Profit</CardTitle>
                    <div className={`p-2 ${netProfit >= 0 ? 'bg-cyan-600' : 'bg-red-600'} rounded-lg`}>
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-cyan-900 dark:text-cyan-100' : 'text-red-900 dark:text-red-100'}`}>${netProfit.toLocaleString()}</div>
                    <p className={`text-xs ${netProfit >= 0 ? 'text-cyan-700 dark:text-cyan-300' : 'text-red-700 dark:text-red-300'} mt-1`}>Revenue - Expenses</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </header>
        )}

        <div className="p-8">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Quick Stats Row */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Bookings</CardTitle>
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{bookings.length}</div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      <span className="font-semibold">{confirmedCount} Confirmed</span> • {pendingCount} Pending
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Upcoming Events</CardTitle>
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{upcomingBookings.length}</div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Confirmed future bookings</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 border-rose-200 dark:border-rose-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-100">Outstanding Balance</CardTitle>
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">${outstandingBalance.toLocaleString()}</div>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{pendingInvoices.length} unpaid invoices</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-teal-200 dark:border-teal-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-teal-900 dark:text-teal-100">Total Expenses</CardTitle>
                    <Receipt className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-teal-900 dark:text-teal-100">${totalExpenses.toLocaleString()}</div>
                    <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">{expenses.length} recorded expenses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Upcoming Events */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => window.dispatchEvent(new CustomEvent("palette:open"))}
                    >
                      <span className="flex items-center">
                        <Search className="h-4 w-4 mr-2" />
                        Search bookings, invoices, contacts…
                      </span>
                      <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        <span className="text-[10px]">Ctrl</span>K
                      </kbd>
                    </Button>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                      onClick={() => {
                        setEditingBooking(undefined);
                        setBookingDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Booking
                    </Button>
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-start" 
                      onClick={() => { 
                        setEditingExpense(undefined); 
                        setExpenseDialogOpen(true); 
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start" 
                      onClick={() => setReminderDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Reminder
                    </Button>
                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white justify-start" 
                      onClick={() => setActiveTab("calendar")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>Next 5 confirmed bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingBookings.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingBookings.slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            role="button"
                            tabIndex={0}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                            onClick={() => { setViewBooking(booking); setViewBookingOpen(true); }}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setViewBooking(booking); setViewBookingOpen(true); } }}
                          >
                            <div>
                              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{booking.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{booking.contact_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{format(new Date(booking.start_date), "MMM d")}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{booking.number_of_guests} guests</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Overview */}
              {pendingInvoices.length > 0 && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Payment Status Overview
                    </CardTitle>
                    <CardDescription>Invoices with outstanding balances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingInvoices.slice(0, 5).map((invoice) => {
                        const booking = bookings.find(b => b.id === invoice.booking_id);
                        return (
                          <div 
                            key={invoice.id} 
                            className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{invoice.client_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{invoice.invoice_number}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">${Number(invoice.balance_due).toFixed(2)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">due</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="ml-4"
                              onClick={() => { 
                                if (booking) { 
                                  setSelectedInvoiceBooking(booking); 
                                  setInvoiceDialogOpen(true); 
                                } 
                              }}
                            >
                              View
                            </Button>
                          </div>
                        );
                      })}
                      {pendingInvoices.length > 5 && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveTab("invoices")}
                        >
                          View All {pendingInvoices.length} Pending Invoices
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100">All Bookings</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">Manage your Yom Tov, Shabaton, and Night Event bookings</CardDescription>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={savingBooking}
                    onClick={() => {
                      setEditingBooking(undefined);
                      setBookingDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {savingBooking ? "Saving..." : "New Booking"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TableFilters
                  searchValue={bookingSearch}
                  onSearchChange={setBookingSearch}
                  searchPlaceholder="Search by name, email, phone, or notes…"
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
                  <EmptyState
                    icon={Calendar}
                    title={bookings.length === 0 ? "No bookings yet" : "No bookings match"}
                    description={
                      bookings.length === 0
                        ? "Create your first booking to start tracking events, payments, and invoices."
                        : "Try removing filters, switching the date range, or clearing the search."
                    }
                    action={
                      bookings.length === 0
                        ? {
                            label: "New booking",
                            icon: Plus,
                            onClick: () => {
                              setEditingBooking(undefined);
                              setBookingDialogOpen(true);
                            },
                          }
                        : undefined
                    }
                    secondaryAction={
                      bookings.length > 0
                        ? {
                            label: "Clear filters",
                            onClick: () => {
                              setBookingSearch("");
                              setBookingDateFilter("all");
                              setBookingStatusFilter("all");
                            },
                          }
                        : undefined
                    }
                  />
                ) : (
                  <BookingList 
                    key={refreshKey} 
                    bookings={filteredBookings} 
                    onEdit={handleEditBooking} 
                    onDelete={handleDeleteBooking} 
                    onUpdateBooking={handleUpdateBooking} 
                    expenses={expenses} 
                    onNavigateToExpenses={handleNavigateToExpenses} 
                    onEditPayment={handleEditPayment}
                    onDeletePayment={handleDeletePayment}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "calendar" && (
            <BookingCalendar key={`calendar-${refreshKey}-${bookings.length}`} bookings={bookings} onBookingClick={handleEditBooking} onAddBooking={() => { setEditingBooking(undefined); setBookingDialogOpen(true); }} />
          )}

          {activeTab === "invoices" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />Invoice Management
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">View and manage all invoices for your bookings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableFilters
                  searchValue={invoiceSearch}
                  onSearchChange={setInvoiceSearch}
                  searchPlaceholder="Search invoices, clients..."
                  sortOrder={invoiceSortOrder}
                  onSortOrderChange={setInvoiceSortOrder}
                  dateFilter={invoiceDateFilter}
                  onDateFilterChange={setInvoiceDateFilter}
                  customDateRange={invoiceCustomRange}
                  onCustomDateRangeChange={setInvoiceCustomRange}
                />
                
                {filteredInvoices.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={invoices.length === 0 ? "No invoices yet" : "No invoices match"}
                    description={
                      invoices.length === 0
                        ? "Invoices auto-generate when you confirm a booking. They'll show up here."
                        : "Try removing filters or clearing the search."
                    }
                    secondaryAction={
                      invoices.length > 0
                        ? { label: "Clear search", onClick: () => setInvoiceSearch("") }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.map((invoice) => {
                      const booking = bookings.find(b => b.id === invoice.booking_id);
                      return (
                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{invoice.invoice_number}</span>
                              <Badge variant={invoice.balance_due > 0 ? "destructive" : "default"}>
                                {invoice.balance_due > 0 ? "Outstanding" : "Paid"}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              <p className="font-medium">{invoice.client_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {format(new Date(invoice.event_date_start), "MMM d")} - {format(new Date(invoice.event_date_end), "MMM d, yyyy")} • {invoice.number_of_guests} guests
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${Number(invoice.total_amount).toFixed(2)}</p>
                              {invoice.balance_due > 0 && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">${Number(invoice.balance_due).toFixed(2)} due</p>
                              )}
                            </div>
                            <Button onClick={() => { if (booking) { setSelectedInvoiceBooking(booking); setInvoiceDialogOpen(true); } }} variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />View
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "budget" && <BudgetDashboard bookings={bookings} expenses={expenses} />}

          {activeTab === "expenses" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Expense Tracking</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">Record expenses with receipts</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setEditingExpense(undefined); setExpenseDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Expense
                  </Button>
                </div>
              </CardHeader>
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
                  <EmptyState
                    icon={DollarSign}
                    title={expenses.length === 0 ? "No expenses recorded" : "No expenses match"}
                    description={
                      expenses.length === 0
                        ? "Track every cost — food, supplies, staff, building costs — and link them to specific bookings."
                        : "Try removing filters or clearing the search."
                    }
                    action={
                      expenses.length === 0
                        ? {
                            label: "Add expense",
                            icon: Plus,
                            onClick: () => {
                              setEditingExpense(undefined);
                              setExpenseDialogOpen(true);
                            },
                          }
                        : undefined
                    }
                    secondaryAction={
                      expenses.length > 0
                        ? {
                            label: "Clear filters",
                            onClick: () => {
                              setExpenseSearch("");
                              setExpenseDateFilter("all");
                            },
                          }
                        : undefined
                    }
                  />
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
          )}

          {activeTab === "receipts" && <ReceiptLibrary expenses={expenses} bookings={bookings} />}

          {activeTab === "manager" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader><CardTitle>Manager Compensation</CardTitle></CardHeader>
              <CardContent><ManagerSalary bookings={bookings} onAddExpense={handleAddExpense} allExpenses={expenses} onExpensesUpdate={loadAllData} /></CardContent>
            </Card>
          )}

          {activeTab === "margin" && <EventMargin bookings={bookings} />}

          {activeTab === "settings" && <PricingSettings />}

          {activeTab === "communications" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader><CardTitle>Client Communications</CardTitle></CardHeader>
              <CardContent><ClientCommunications bookings={bookings} onRefresh={loadAllData} /></CardContent>
            </Card>
          )}

          {activeTab === "emails" && <EmailHistory bookings={bookings.map(b => ({ id: b.id, name: b.name, contact_name: b.contact_name }))} />}

          {activeTab === "feedback" && (
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
          )}

          {activeTab === "insights" && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Interesting Facts & Insights
                </CardTitle>
                <CardDescription>Key statistics and insights about your resort operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Guests (All Time)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">{totalGuests}</div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">Across {bookings.length} bookings</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">Average Guests per Booking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                        {bookings.length > 0 ? Math.round(totalGuests / bookings.length) : 0}
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Per event average</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 border-rose-200 dark:border-rose-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-100">Average Revenue per Booking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-rose-900 dark:text-rose-100">
                        ${bookings.length > 0 ? Math.round(totalRevenue / bookings.length).toLocaleString() : 0}
                      </div>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-2">Per event average</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-teal-200 dark:border-teal-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-teal-900 dark:text-teal-100">Total Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-teal-900 dark:text-teal-100">{invoices.length}</div>
                      <p className="text-xs text-teal-700 dark:text-teal-300 mt-2">Generated invoices</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Total Expenses Recorded</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-indigo-900 dark:text-indigo-100">{expenses.length}</div>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">Tracked expenses</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Profit Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-900 dark:text-green-100">
                        {totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">Overall margin</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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

      {viewBooking && (
        <ClientDetailsDialog
          // Key tied to booking.id forces a fresh mount when switching bookings.
          key={viewBooking.id}
          open={viewBookingOpen}
          onOpenChange={(o) => { setViewBookingOpen(o); if (!o) setViewBooking(null); }}
          booking={viewBooking}
          allExpenses={expenses}
          onNavigateToExpenses={handleNavigateToExpenses}
        />
      )}

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} onSave={handleSaveBooking} booking={editingBooking} bookings={bookings} />
      <ExpenseDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} onSave={handleSaveExpense} expense={editingExpense} bookings={bookings} />
      {selectedInvoiceBooking && <InvoiceDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} booking={selectedInvoiceBooking} />}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setEditingPayment(undefined);
            setPaymentBooking(undefined);
          }
        }}
        booking={paymentBooking}
        onPaymentAdded={loadAllData}
        editingPayment={editingPayment}
      />
      </div>
    </div>
  );
}