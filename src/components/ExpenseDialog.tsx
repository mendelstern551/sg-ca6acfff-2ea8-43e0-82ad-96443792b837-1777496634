import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { Expense, Booking } from "@/types/booking";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
  bookings: Booking[];
}

export function ExpenseDialog({ open, onOpenChange, onSave, expense, bookings }: ExpenseDialogProps) {
  const [formData, setFormData] = useState({
    bookingId: "",
    date: undefined as Date | undefined,
    amount: "",
    category: "",
    description: "",
    paymentMethod: "",
    vendor: "",
    notes: "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (expense) {
      setFormData({
        bookingId: expense.bookingId || "",
        date: new Date(expense.date),
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        vendor: expense.vendor,
        notes: expense.notes,
      });
    }
  }, [expense]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "receipt" | "proof") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "receipt") {
        setReceiptFile(file);
      } else {
        setProofFile(file);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "receipt" | "proof" | "additional") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "additional") {
      // Handle multiple files for additional uploads
      const newFiles: { id: string; url: string; name: string; uploadedAt: string }[] = [];
      
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          newFiles.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: dataUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
          });
          
          // Update state after all files are read
          if (newFiles.length === files.length) {
            setFormData({
              ...formData,
              receiptFiles: [...formData.receiptFiles, ...newFiles],
            });
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      // Handle single file for receipt/proof
      const file = files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const dataUrl = reader.result as string;

        if (type === "receipt") {
          setFormData({ ...formData, receiptUrl: dataUrl });
        } else if (type === "proof") {
          setFormData({ ...formData, proofOfPaymentUrl: dataUrl });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    const newExpense: Expense = {
      id: expense?.id || `expense-${Date.now()}`,
      bookingId: formData.bookingId || undefined,
      date: formData.date.toISOString(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor,
      receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : expense?.receiptUrl,
      proofOfPaymentUrl: proofFile ? URL.createObjectURL(proofFile) : expense?.proofOfPaymentUrl,
      notes: formData.notes,
      createdAt: expense?.createdAt || new Date().toISOString(),
    };

    onSave(newExpense);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      bookingId: "",
      date: undefined,
      amount: "",
      category: "",
      description: "",
      paymentMethod: "",
      vendor: "",
      notes: "",
    });
    setReceiptFile(null);
    setProofFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            Record expense details including receipts and payment proof
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Related Booking (Optional)</Label>
                <Select
                  value={formData.bookingId}
                  onValueChange={(value) => setFormData({ ...formData, bookingId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal pointer-events-auto"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 pointer-events-auto" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        setFormData({ ...formData, date });
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
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Catering</SelectItem>
                    <SelectItem value="cleaning">Cleaning & Maintenance</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="staff">Staff & Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor/Supplier</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Company or person name"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was purchased or paid for?"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, "receipt")}
                  className="flex-1"
                />
                {receiptFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {receiptFile && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selected: {receiptFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Proof of Payment Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, "proof")}
                  className="flex-1"
                />
                {proofFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProofFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {proofFile && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selected: {proofFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalFiles" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Additional Files (Multiple)
              </Label>
              <Input
                id="additionalFiles"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  handleFileUpload(e, "additional");
                  // Clear the input so the same file can be selected again
                  e.target.value = "";
                }}
                multiple
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select multiple files to upload at once
              </p>
              {formData.receiptFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.receiptFiles.map((file) => (
                    <Badge key={file.id} variant="secondary" className="flex items-center gap-2">
                      {file.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveReceiptFile(file.id)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {expense ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
