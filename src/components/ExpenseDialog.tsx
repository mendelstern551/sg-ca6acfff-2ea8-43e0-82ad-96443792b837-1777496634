
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
      booking_id: bookingId === "none" ? null : bookingId,
      description,
      amount: Number(amount),
      category,
      vendor,
      payment_method: paymentMethod,
      expense_date: date.toISOString(),
      receipt_url: receiptUrls[0] || null,
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
              <Select value={bookingId || "none"} onValueChange={(value) => setBookingId(value === "none" ? null : value)}>
                <SelectTrigger><SelectValue placeholder="Select booking" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (General Expense)</SelectItem>
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
