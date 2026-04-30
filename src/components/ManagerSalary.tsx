import { useState, useEffect, useRef } from "react";
import { Plus, DollarSign, TrendingUp, Pencil, Trash2 } from "lucide-react";
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
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { expenseService } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { loadAppSetting, saveAppSetting } from "@/lib/settingsStore";

// Settings (commission %, season, monthly fee) — synced via app_settings.
// Payments — synced via manager_payment_log.
// Key matches legacy localStorage name `trout-lake-manager-salary`.
const SETTINGS_KEY = "manager-salary";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

interface ManagerSalaryProps {
  bookings: Booking[];
  onAddExpense: (expense: ExpenseInsert) => Promise<void>;
  allExpenses: Expense[];
  onExpensesUpdate: () => void;
}

export function ManagerSalary({ bookings, onAddExpense, allExpenses, onExpensesUpdate }: ManagerSalaryProps) {
  const { toast } = useToast();
  const [salaryData, setSalaryData] = useState<ManagerSalaryData>({
    maintenanceFeePerMonth: 1000,
    commissionPercentage: 15,
    minimumCommissionPerEvent: 1000,
    seasonStart: "2025-10-01",
    seasonEnd: "2026-07-01",
    payments: []
  });

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date(),
    amount: 0,
    paymentMethod: "check" as PaymentMethod,
    referenceNumber: "",
    type: "maintenance" as "maintenance" | "commission" | "other",
    relatedBookingId: "",
    notes: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load admin settings from app_settings (Supabase + local mirror) and the
  // payment log from manager_payment_log (Supabase). Both fall back gracefully
  // to localStorage / empty list if their tables don't exist yet.
  useEffect(() => {
    const baseDefaults: Omit<ManagerSalaryData, "payments"> = {
      maintenanceFeePerMonth: 1000,
      commissionPercentage: 15,
      minimumCommissionPerEvent: 1000,
      seasonStart: "2025-10-01",
      seasonEnd: "2026-07-01",
    };
    let cancelled = false;

    // Settings sync via app_settings.
    loadAppSetting<Omit<ManagerSalaryData, "payments">>(SETTINGS_KEY, baseDefaults).then((s) => {
      if (cancelled) return;
      setSalaryData((c) => ({ ...c, ...s }));
    });

    // Pull payments from Supabase. If the table doesn't exist yet, keep the
    // localStorage fallback so the UI still works.
    (async () => {
      // Cast through `any` because the generated Supabase types don't include the
      // newly-added manager_payment_log table until the user runs the migration
      // and regenerates types. The runtime call is correct.
      const { data, error } = await (supabase as any)
        .from("manager_payment_log")
        .select("*")
        .order("date", { ascending: false });
      if (cancelled) return;
      if (error) {
        // Silently fall back to localStorage payments — happens before the user
        // has run the manager_payment_log migration.
        console.warn("manager_payment_log not available — using local fallback:", error.message);
        // Try a localStorage mirror once for legacy payments.
        try {
          const saved = window.localStorage.getItem("trout-lake-manager-salary");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.payments)) {
              setSalaryData((c) => ({ ...c, payments: parsed.payments }));
            }
          }
        } catch { /* ignore */ }
        return;
      }
      const remote: ManagerPayment[] = (data || []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        date: String(r.date),
        amount: Number(r.amount) || 0,
        paymentMethod: r.payment_method as PaymentMethod,
        referenceNumber: (r.reference_number as string) || "",
        type: r.type as "maintenance" | "commission" | "other",
        relatedBookingId: (r.related_booking_id as string) || undefined,
        notes: (r.notes as string) || "",
        createdAt: (r.created_at as string) || new Date().toISOString(),
      }));
      setSalaryData((c) => ({ ...c, payments: remote }));
    })();

    return () => { cancelled = true; };
  }, []);

  // Persist settings (everything except payments) to app_settings whenever they
  // change. Debounced so rapid edits don't fire many writes.
  const settingsLoadedRef = useRef(false);
  useEffect(() => {
    if (!settingsLoadedRef.current) {
      // Skip the very first effect after mount — that's just the load echoing.
      settingsLoadedRef.current = true;
      return;
    }
    const handle = setTimeout(() => {
      const { payments: _ignored, ...settings } = salaryData;
      saveAppSetting(SETTINGS_KEY, settings);
    }, 500);
    return () => clearTimeout(handle);
  }, [
    salaryData.maintenanceFeePerMonth,
    salaryData.commissionPercentage,
    salaryData.minimumCommissionPerEvent,
    salaryData.seasonStart,
    salaryData.seasonEnd,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  useEffect(() => {
    if (!isProcessing && salaryData) {
      createAllManagerExpenses();
    }
  }, [salaryData.seasonStart, salaryData.seasonEnd, salaryData.maintenanceFeePerMonth, bookings.length]);

  const createAllManagerExpenses = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await createMonthlyMaintenanceExpenses();
      await createBookingCommissionExpenses();
    } catch (error) {
      console.error("Error creating manager expenses:", error);
      toast({
        title: "Error",
        description: "Failed to create manager expenses",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createMonthlyMaintenanceExpenses = async () => {
    const seasonStart = new Date(salaryData.seasonStart);
    const seasonEnd = new Date(salaryData.seasonEnd);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    if (isBefore(currentMonthStart, seasonStart) || isAfter(currentMonthStart, seasonEnd)) {
      return;
    }

    const maintenanceExpenses = allExpenses.filter(exp => 
      exp.category === "Manager Salary" && 
      exp.description?.includes("Monthly Maintenance Fee")
    );

    const currentMonthExists = maintenanceExpenses.some(exp => {
      const expenseMonth = startOfMonth(new Date(exp.expense_date));
      return expenseMonth.getTime() === currentMonthStart.getTime();
    });

    if (!currentMonthExists) {
      const expense: ExpenseInsert = {
        booking_id: null,
        expense_date: currentMonthStart.toISOString(),
        amount: salaryData.maintenanceFeePerMonth,
        category: "Manager Salary",
        description: `Monthly Maintenance Fee - ${format(currentMonthStart, "MMMM yyyy")}`,
        payment_method: "pending",
        vendor: "Manager",
        notes: `Maintenance fee of $${salaryData.maintenanceFeePerMonth.toLocaleString()} - Automatically charged on 1st of every month`,
        receipt_urls: [],
        proof_urls: []
      };
      
      await onAddExpense(expense);
      onExpensesUpdate();
    }
  };

  const createBookingCommissionExpenses = async () => {
    const commissionExpenses = allExpenses.filter(exp => 
      exp.category === "Manager Salary" && 
      exp.description?.includes("Manager Commission")
    );

    const commissionsByBooking = new Map<string, Expense[]>();
    commissionExpenses.forEach(exp => {
      if (exp.booking_id) {
        if (!commissionsByBooking.has(exp.booking_id)) {
          commissionsByBooking.set(exp.booking_id, []);
        }
        commissionsByBooking.get(exp.booking_id)!.push(exp);
      }
    });

    const deletePromises: Promise<void>[] = [];
    for (const [bookingId, expenses] of commissionsByBooking) {
      if (expenses.length > 1) {
        const expensesToDelete = expenses.slice(1);
        expensesToDelete.forEach(expense => {
          deletePromises.push(expenseService.deleteExpense(expense.id));
        });
      }
    }

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      onExpensesUpdate();
      return;
    }

    const createPromises: Promise<any>[] = [];
    for (const booking of bookings) {
      if (!booking?.id || !booking.total_cost) {
        continue;
      }

      const expenseExists = commissionExpenses.some(exp => exp.booking_id === booking.id);

      if (!expenseExists) {
        const commission = Math.max(
          booking.total_cost * (salaryData.commissionPercentage / 100),
          salaryData.minimumCommissionPerEvent
        );

        const bookingTypeName = booking.booking_type ? 
          booking.booking_type.toString().replace(/_/g, " ") : 
          "event";

        const expense: ExpenseInsert = {
          booking_id: booking.id,
          expense_date: booking.start_date || new Date().toISOString(),
          amount: commission,
          category: "Manager Salary",
          description: `Manager Commission - ${booking.name || "Event"}`,
          payment_method: "pending",
          vendor: "Manager",
          notes: `15% commission (min $1,000) for ${bookingTypeName} booking`,
          receipt_urls: [],
          proof_urls: []
        };
        createPromises.push(onAddExpense(expense));
      }
    }
      
    if (createPromises.length > 0) {
      await Promise.all(createPromises);
      onExpensesUpdate();
    }
  };

  const calculateMaintenanceFees = () => {
    const seasonStart = new Date(salaryData.seasonStart);
    const seasonEnd = new Date(salaryData.seasonEnd);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    if (isBefore(currentMonthStart, seasonStart)) return 0;
    if (isAfter(currentMonthStart, seasonEnd)) {
      return (differenceInMonths(seasonEnd, seasonStart) + 1) * salaryData.maintenanceFeePerMonth;
    }
    return (differenceInMonths(currentMonthStart, seasonStart) + 1) * salaryData.maintenanceFeePerMonth;
  };

  const getMonthsElapsedText = () => {
    const seasonStart = new Date(salaryData.seasonStart);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    if (isBefore(currentMonthStart, seasonStart)) return "Season hasn't started";
    const monthsElapsed = differenceInMonths(currentMonthStart, seasonStart) + 1;
    return `${monthsElapsed} ${monthsElapsed === 1 ? "month" : "months"} elapsed`;
  };

  const calculateCommissions = () => {
    return bookings.reduce((total, booking) => {
      if (!booking.total_cost) return total;
      const commission = Math.max(
        booking.total_cost * (salaryData.commissionPercentage / 100),
        salaryData.minimumCommissionPerEvent
      );
      return total + commission;
    }, 0);
  };

  const totalMaintenanceFees = calculateMaintenanceFees();
  const totalCommissions = calculateCommissions();
  const totalOwed = totalMaintenanceFees + totalCommissions;
  const payments = Array.isArray(salaryData.payments) ? salaryData.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = totalOwed - totalPaid;

  const handleAddPayment = async () => {
    if (!paymentForm.date || paymentForm.amount <= 0) {
      toast({
        title: "Invalid Payment",
        description: "Please enter a valid date and amount",
        variant: "destructive"
      });
      return;
    }

    try {
      const row = {
        date: paymentForm.date.toISOString(),
        amount: paymentForm.amount,
        payment_method: paymentForm.paymentMethod,
        reference_number: paymentForm.referenceNumber || null,
        type: paymentForm.type,
        related_booking_id: paymentForm.relatedBookingId || null,
        notes: paymentForm.notes || null,
      };

      let saved: Record<string, unknown> | null = null;
      let dbErr: { message: string } | null = null;

      if (editingPaymentId) {
        // UPDATE existing row
        const { data, error } = await (supabase as any)
          .from("manager_payment_log")
          .update(row)
          .eq("id", editingPaymentId)
          .select()
          .single();
        saved = data;
        dbErr = error;
      } else {
        // INSERT new row
        const { data, error } = await (supabase as any)
          .from("manager_payment_log")
          .insert(row)
          .select()
          .single();
        saved = data;
        dbErr = error;
      }

      if (dbErr) {
        console.warn("manager_payment_log save failed — local fallback:", dbErr.message);
      }

      const savedPayment: ManagerPayment = saved
        ? {
            id: String(saved.id),
            date: String(saved.date),
            amount: Number(saved.amount) || 0,
            paymentMethod: saved.payment_method as PaymentMethod,
            referenceNumber: (saved.reference_number as string) || "",
            type: saved.type as "maintenance" | "commission" | "other",
            relatedBookingId: (saved.related_booking_id as string) || undefined,
            notes: (saved.notes as string) || "",
            createdAt: (saved.created_at as string) || new Date().toISOString(),
          }
        : {
            id: editingPaymentId || Date.now().toString(),
            date: paymentForm.date.toISOString(),
            amount: paymentForm.amount,
            paymentMethod: paymentForm.paymentMethod,
            referenceNumber: paymentForm.referenceNumber,
            type: paymentForm.type,
            relatedBookingId: paymentForm.relatedBookingId || undefined,
            notes: paymentForm.notes,
            createdAt: new Date().toISOString(),
          };

      // Replace existing or append
      const existingIndex = (salaryData.payments || []).findIndex((p) => p.id === savedPayment.id);
      const nextPayments = existingIndex >= 0
        ? salaryData.payments.map((p) => (p.id === savedPayment.id ? savedPayment : p))
        : [...(salaryData.payments || []), savedPayment];

      setSalaryData({ ...salaryData, payments: nextPayments });

      const expense: ExpenseInsert = {
        booking_id: paymentForm.relatedBookingId || null,
        expense_date: paymentForm.date.toISOString(),
        amount: paymentForm.amount,
        category: "Manager Salary",
        description: `Manager Payment - ${paymentForm.type}`,
        payment_method: paymentForm.paymentMethod,
        vendor: "Manager",
        notes: paymentForm.notes || `Payment for ${paymentForm.type}`,
        receipt_urls: [],
        proof_urls: []
      };

      // Only create the matching expense on a fresh INSERT — editing an existing
      // payment shouldn't duplicate the expense entry.
      if (!editingPaymentId) {
        await onAddExpense(expense);
        onExpensesUpdate();
      }

      toast({
        title: editingPaymentId ? "Payment Updated" : "Payment Recorded",
        description: `Manager payment of $${paymentForm.amount.toLocaleString()} ${editingPaymentId ? "updated" : "recorded"} successfully`
      });

      setEditingPaymentId(null);
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
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Error",
        description: "Failed to save payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditPayment = (payment: ManagerPayment) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      date: new Date(payment.date),
      amount: Number(payment.amount) || 0,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || "",
      type: payment.type,
      relatedBookingId: payment.relatedBookingId || "",
      notes: payment.notes || "",
    });
    setPaymentDialogOpen(true);
  };

  const handleDeletePayment = async (payment: ManagerPayment) => {
    const proceed = window.confirm(
      `Delete the $${Number(payment.amount).toLocaleString()} ${payment.type} payment from ${format(new Date(payment.date), "MMM d, yyyy")}?\n\nThis cannot be undone. The matching expense entry will not be auto-removed — delete it manually if needed.`
    );
    if (!proceed) return;

    try {
      const { error } = await (supabase as any)
        .from("manager_payment_log")
        .delete()
        .eq("id", payment.id);
      if (error) {
        console.warn("manager_payment_log delete failed — local-only:", error.message);
      }
      setSalaryData({
        ...salaryData,
        payments: (salaryData.payments || []).filter((p) => p.id !== payment.id),
      });
      toast({
        title: "Payment Deleted",
        description: `Removed the $${Number(payment.amount).toLocaleString()} ${payment.type} payment.`
      });
    } catch (err) {
      console.error("Delete payment failed:", err);
      toast({ title: "Delete failed", description: "Try again.", variant: "destructive" });
    }
  };

  const handleOpenDialog = (open: boolean) => {
    if (open && !editingPaymentId) {
      // Fresh "Add Payment" — start blank. (Edit flows pre-fill via handleEditPayment.)
      setPaymentForm({
        date: new Date(),
        amount: 0,
        paymentMethod: "check",
        referenceNumber: "",
        type: "maintenance",
        relatedBookingId: "",
        notes: ""
      });
    }
    if (!open) {
      // Closing without saving → drop the edit context.
      setEditingPaymentId(null);
    }
    setPaymentDialogOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceFees.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{getMonthsElapsedText()}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">15% per booking (min $1,000)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{payments.length} payments made</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceDue > 0 ? "text-orange-600" : "text-green-600"}`}>${balanceDue.toLocaleString()}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Remaining to pay</p>
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
                    if (!booking.total_cost) return null;
                    const commission = Math.max(
                      booking.total_cost * (salaryData.commissionPercentage / 100),
                      salaryData.minimumCommissionPerEvent
                    );
                    const startDate = booking.start_date ? new Date(booking.start_date) : null;
                    const dateLabel = startDate && !isNaN(startDate.getTime())
                      ? format(startDate, "MMM d, yyyy")
                      : "—";
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{booking.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{dateLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${commission.toLocaleString()}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{commission === salaryData.minimumCommissionPerEvent ? "Minimum" : "15%"}</p>
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
              <Dialog open={paymentDialogOpen} onOpenChange={handleOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPaymentId ? "Edit Manager Payment" : "Record Manager Payment"}</DialogTitle>
                    <DialogDescription>
                      {editingPaymentId
                        ? "Update the payment details below."
                        : "This will automatically create an expense entry"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Type first — picking "Commission" + a booking auto-fills the amount. */}
                    <div className="space-y-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select
                        value={paymentForm.type}
                        onValueChange={(value: "maintenance" | "commission" | "other") => {
                          let nextAmount = paymentForm.amount;
                          if (value === "maintenance") {
                            // Auto-fill monthly maintenance fee.
                            nextAmount = salaryData.maintenanceFeePerMonth;
                          } else if (value === "commission" && paymentForm.relatedBookingId) {
                            const b = bookings.find((x) => x.id === paymentForm.relatedBookingId);
                            if (b) {
                              nextAmount = Math.max(
                                (Number(b.total_cost) || 0) * (salaryData.commissionPercentage / 100),
                                salaryData.minimumCommissionPerEvent
                              );
                            }
                          }
                          setPaymentForm({ ...paymentForm, type: value, amount: nextAmount });
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                          <SelectItem value="commission">Commission</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentForm.type === "commission" && (
                      <div className="space-y-2">
                        <Label htmlFor="booking">Related Booking</Label>
                        <Select
                          value={paymentForm.relatedBookingId || undefined}
                          onValueChange={(value) => {
                            const id = value === "none" ? "" : value;
                            let nextAmount = paymentForm.amount;
                            if (id) {
                              const b = bookings.find((x) => x.id === id);
                              if (b) {
                                nextAmount = Math.max(
                                  (Number(b.total_cost) || 0) * (salaryData.commissionPercentage / 100),
                                  salaryData.minimumCommissionPerEvent
                                );
                              }
                            }
                            setPaymentForm({ ...paymentForm, relatedBookingId: id, amount: nextAmount });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a booking — commission auto-fills" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (manual)</SelectItem>
                            {bookings.map((booking) => (
                              <SelectItem key={booking.id} value={booking.id}>
                                {booking.name} — {format(new Date(booking.start_date), "MMM d, yyyy")} · ${Number(booking.total_cost || 0).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {paymentForm.relatedBookingId && (
                          <p className="text-xs text-muted-foreground">
                            {salaryData.commissionPercentage}% of revenue, minimum $
                            {salaryData.minimumCommissionPerEvent.toLocaleString()}.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {paymentForm.date ? format(paymentForm.date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <EnhancedCalendar
                            mode="single"
                            selected={paymentForm.date || new Date()}
                            onSelect={(date) => {
                              if (date && date instanceof Date && !isNaN(date.getTime())) {
                                setPaymentForm({ ...paymentForm, date });
                              }
                            }}
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
                        value={paymentForm.amount || ""}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={paymentForm.paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      {editingPaymentId ? "Save Changes" : "Record Payment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No payments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {[...payments]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">${payment.amount.toLocaleString()}</p>
                          <Badge variant={payment.type === "maintenance" ? "default" : "secondary"}>{payment.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {format(new Date(payment.date), "MMM d, yyyy")} • {payment.paymentMethod}
                          {payment.referenceNumber && ` • ref ${payment.referenceNumber}`}
                        </p>
                        {payment.notes && <p className="text-xs text-slate-500 mt-1 truncate">{payment.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditPayment(payment)}
                          aria-label="Edit payment"
                          title="Edit payment"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayment(payment)}
                          aria-label="Delete payment"
                          title="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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