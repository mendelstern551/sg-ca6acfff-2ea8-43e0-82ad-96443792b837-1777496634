
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { CalendarIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Expense, Booking } from "@/types/booking";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Omit<Expense, "id" | "created_at" | "updated_at">) => void;
  expense?: Expense;
  bookings: Booking[];
}

export function ExpenseDialog({ open, onOpenChange, onSave, expense, bookings }: ExpenseDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("other");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [notes, setNotes] = useState("");
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(Number(expense.amount));
      setCategory(expense.category);
      setVendor(expense.vendor || "");
      setDate(new Date(expense.expense_date));
      setBookingId(expense.booking_id);
      setPaymentMethod(expense.payment_method);
      setNotes(expense.notes || "");
      setReceiptUrls(expense.receipt_urls || []);
      setProofUrls(expense.proof_urls || []);
    } else {
      resetForm();
    }
  }, [expense, open]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("other");
    setVendor("");
    setDate(new Date());
    setBookingId(null);
    setPaymentMethod("credit_card");
    setNotes("");
    setReceiptUrls([]);
    setProofUrls([]);
  };

  const handleSave = () => {
    if (!description || amount === "" || amount <= 0 || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill out description, amount, and date.",
        variant: "destructive"
      });
      return;
    }

    onSave({
      booking_id: bookingId,
      description,
      amount: Number(amount),
      category,
      vendor,
      payment_method: paymentMethod,
      expense_date: date.toISOString(),
      receipt_urls: receiptUrls,
      proof_urls: proofUrls,
      notes,
    });
    onOpenChange(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'proof') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `expenses/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      if (type === 'receipt') {
        setReceiptUrls([...receiptUrls, data.publicUrl]);
      } else {
        setProofUrls([...proofUrls, data.publicUrl]);
      }
      
      toast({ title: "File uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (url: string, type: 'receipt' | 'proof') => {
    if (type === 'receipt') {
      setReceiptUrls(receiptUrls.filter(u => u !== url));
    } else {
      setProofUrls(proofUrls.filter(u => u !== url));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            Record an expense and associate it with a booking if necessary.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries for event" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || "")} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="equipment">Equipment Rental</SelectItem>
                  <SelectItem value="Manager Salary">Manager Salary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Input id="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Costco" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><EnhancedCalendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Related Booking (Optional)</Label>
              <Select value={bookingId || ""} onValueChange={(value) => setBookingId(value || null)}>
                <SelectTrigger><SelectValue placeholder="Select booking" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (General Expense)</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>{booking.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details" />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                Receipts
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="receipt-upload" className="cursor-pointer flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Receipt
                  </label>
                </Button>
                <input id="receipt-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'receipt')} disabled={isUploading} />
              </div>
              <div className="mt-2 space-y-2">
                {receiptUrls.map(url => (
                  <div key={url} className="flex items-center justify-between text-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{url.split('/').pop()}</a>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(url, 'receipt')}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                Proof of Payment
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </Label>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="proof-upload" className="cursor-pointer flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Proof
                  </label>
                </Button>
                <input id="proof-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'proof')} disabled={isUploading} />
              </div>
               <div className="mt-2 space-y-2">
                {proofUrls.map(url => (
                  <div key={url} className="flex items-center justify-between text-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{url.split('/').pop()}</a>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(url, 'proof')}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Button onClick={handleSave} className="w-full">{expense ? "Save Changes" : "Create Expense"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
</full_file-rewrite><full_file_rewrite file/home/daytona/actions><full_file_rewrite file_path="src/components/BudgetDashboard.tsx">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Booking, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";

interface BudgetDashboardProps {
  bookings: Booking[];
  expenses: Expense[];
}

export function BudgetDashboard({ bookings, expenses }: BudgetDashboardProps) {
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_cost), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const getCategoryTotal = (category: string) => {
    return expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const expenseCategories = [
    { name: "Food", total: getCategoryTotal("food"), color: "bg-orange-500" },
    { name: "Cleaning", total: getCategoryTotal("cleaning"), color: "bg-blue-500" },
    { name: "Supplies", total: getCategoryTotal("supplies"), color: "bg-purple-500" },
    { name: "Utilities", total: getCategoryTotal("utilities"), color: "bg-yellow-500" },
    { name: "Staff", total: getCategoryTotal("staff"), color: "bg-green-500" },
    { name: "Equipment Rental", total: getCategoryTotal("equipment"), color: "bg-indigo-500" },
    { name: "Manager Salary", total: getCategoryTotal("Manager Salary"), color: "bg-emerald-500" },
    { name: "Other", total: getCategoryTotal("other"), color: "bg-slate-500" },
  ].filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Overall performance of all bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-sm text-stone-600 dark:text-stone-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 mb-2" />
              <p className="text-sm text-stone-600 dark:text-stone-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 mb-2" />
              <p className="text-sm text-stone-600 dark:text-stone-400">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Percent className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-sm text-stone-600 dark:text-stone-400">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>How your total expenses are distributed across categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {totalExpenses > 0 ? (
            <div className="space-y-4">
              {expenseCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-stone-600 dark:text-stone-400">
                      {formatCurrency(category.total)}
                      <span className="ml-2 text-xs">
                        ({((category.total / totalExpenses) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={(category.total / totalExpenses) * 100} className="h-2" indicatorclassname={category.color} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-stone-500">No expenses recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
