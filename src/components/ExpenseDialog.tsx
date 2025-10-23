
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Expense, Booking, PaymentMethod } from "@/types/booking";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
  bookings: Booking[];
}

const initialFormData = {
  bookingId: "",
  date: new Date(),
  amount: 0,
  category: "other",
  description: "",
  paymentMethod: "cash" as PaymentMethod,
  vendor: "",
  receiptUrl: "",
  proofOfPaymentUrl: "",
  receiptFiles: [] as { id: string; url: string; name: string; uploadedAt: string }[],
  notes: "",
};

export function ExpenseDialog({ open, onOpenChange, onSave, expense, bookings }: ExpenseDialogProps) {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (open) {
      if (expense) {
        setFormData({
          bookingId: expense.bookingId || "",
          date: new Date(expense.date),
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          paymentMethod: expense.paymentMethod as PaymentMethod,
          vendor: expense.vendor,
          receiptUrl: expense.receiptUrl || "",
          proofOfPaymentUrl: expense.proofOfPaymentUrl || "",
          receiptFiles: expense.receiptFiles || [],
          notes: expense.notes,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [expense, open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "receipt" | "proof" | "additional") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "additional") {
      const newFiles: { id: string; url: string; name: string; uploadedAt: string }[] = [];
      const fileArray = Array.from(files);
      let filesProcessed = 0;

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          newFiles.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: dataUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
          });
          
          filesProcessed++;
          if (filesProcessed === fileArray.length) {
            setFormData(prev => ({
              ...prev,
              receiptFiles: [...prev.receiptFiles, ...newFiles],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (type === "receipt") {
          setFormData(prev => ({ ...prev, receiptUrl: dataUrl }));
        } else if (type === "proof") {
          setFormData(prev => ({ ...prev, proofOfPaymentUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveReceiptFile = (fileId: string) => {
    setFormData({
      ...formData,
      receiptFiles: formData.receiptFiles.filter((f) => f.id !== fileId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expenseData: Expense = {
      id: expense?.id || `expense-${Date.now()}`,
      bookingId: formData.bookingId || undefined,
      date: formData.date.toISOString(),
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor,
      receiptUrl: formData.receiptUrl || undefined,
      proofOfPaymentUrl: formData.proofOfPaymentUrl || undefined,
      receiptFiles: formData.receiptFiles.length > 0 ? formData.receiptFiles : undefined,
      notes: formData.notes,
      createdAt: expense?.createdAt || new Date().toISOString(),
    };

    onSave(expenseData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>Record expense details including receipts and payment proof</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bookingId">Related Booking (Optional)</Label>
              <Select value={formData.bookingId} onValueChange={(value) => setFormData({ ...formData, bookingId: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - General Expense</SelectItem>
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
                  <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formData.date} onSelect={(date) => date && setFormData({ ...formData, date })} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., cleaning on premises"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: PaymentMethod) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Upload Files</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receipt" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Receipt
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, "receipt")}
                    className="flex-1"
                  />
                  {formData.receiptUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, receiptUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.receiptUrl && (
                  <Badge variant="secondary" className="text-xs">
                    Receipt uploaded
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proof of Payment
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, "proof")}
                    className="flex-1"
                  />
                  {formData.proofOfPaymentUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, proofOfPaymentUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.proofOfPaymentUrl && (
                  <Badge variant="secondary" className="text-xs">
                    Proof uploaded
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalFiles" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Additional Files
              </Label>
              <Input
                id="additionalFiles"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  handleFileUpload(e, "additional");
                  e.target.value = "";
                }}
                multiple
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">You can select multiple files.</p>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {expense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
