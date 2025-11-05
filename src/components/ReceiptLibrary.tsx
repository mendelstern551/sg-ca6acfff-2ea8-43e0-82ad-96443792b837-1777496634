import { useState, useMemo } from "react";
import { Expense, Booking } from "@/types/booking";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, Image, Download, Calendar, DollarSign, Tag, Building } from "lucide-react";
import { formatCurrency } from "@/lib/bookingCalculations";

interface ReceiptLibraryProps {
  expenses: Expense[];
  bookings: Booking[];
}

export function ReceiptLibrary({ expenses, bookings }: ReceiptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      cleaning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      supplies: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      utilities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      staff: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      equipment: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      "Manager Salary": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      other: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[category] || colors.other;
  };

  const getBookingName = (bookingId: string | null) => {
    if (!bookingId) return "General Expense";
    const booking = bookings.find(b => b.id === bookingId);
    return booking ? booking.name : "Unknown Booking";
  };

  const allReceipts = useMemo(() => {
    const receipts: Array<{
      id: string;
      expenseId: string;
      expenseDescription: string;
      vendor: string;
      category: string;
      amount: number;
      date: string;
      bookingName: string | null;
      url: string;
      name: string;
      uploadedAt: string;
      type: "receipt" | "proof" | "file";
    }> = [];

    expenses.forEach((expense) => {
      if (expense.receipt_urls && expense.receipt_urls.length > 0) {
        expense.receipt_urls.forEach((url, index) => {
          receipts.push({
            id: `${expense.id}-receipt-${index}`,
            expenseId: expense.id,
            expenseDescription: expense.description,
            vendor: expense.vendor || 'N/A',
            category: expense.category,
            amount: expense.amount,
            date: expense.expense_date,
            bookingName: getBookingName(expense.booking_id),
            url: url,
            name: `Receipt ${index + 1}`,
            uploadedAt: expense.created_at,
            type: "receipt",
          });
        });
      }

      if (expense.proof_urls && expense.proof_urls.length > 0) {
        expense.proof_urls.forEach((url, index) => {
          receipts.push({
            id: `${expense.id}-proof-${index}`,
            expenseId: expense.id,
            expenseDescription: expense.description,
            vendor: expense.vendor || 'N/A',
            category: expense.category,
            amount: expense.amount,
            date: expense.expense_date,
            bookingName: getBookingName(expense.booking_id),
            url: url,
            name: `Proof of Payment ${index + 1}`,
            uploadedAt: expense.created_at,
            type: "proof",
          });
        });
      }
    });

    return receipts.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [expenses, bookings]);

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return allReceipts;

    const query = searchQuery.toLowerCase();
    return allReceipts.filter(
      (receipt) =>
        receipt.expenseDescription.toLowerCase().includes(query) ||
        receipt.vendor.toLowerCase().includes(query) ||
        receipt.category.toLowerCase().includes(query) ||
        receipt.bookingName?.toLowerCase().includes(query) ||
        receipt.name.toLowerCase().includes(query) ||
        format(new Date(receipt.date), "MMM d, yyyy").toLowerCase().includes(query)
    );
  }, [allReceipts, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Receipt Library
        </CardTitle>
        <CardDescription>Search and manage all uploaded receipts and payment proofs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by expense, vendor, category, booking, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <FileText className="h-4 w-4" />
            <span>{filteredReceipts.length} files</span>
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {searchQuery ? (
              <>
                <p className="text-lg font-medium mb-2">No receipts found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">No receipts uploaded yet</p>
                <p className="text-sm">Upload receipts when adding expenses</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReceipts.map((receipt) => (
              <Card key={receipt.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {receipt.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <Image className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-slate-600" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {receipt.type === "receipt" ? "Receipt" : receipt.type === "proof" ? "Proof" : "File"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(receipt.url, "_blank")}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{receipt.expenseDescription}</h3>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-semibold">{formatCurrency(receipt.amount)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{receipt.vendor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      <Badge className={getCategoryColor(receipt.category)} variant="secondary">
                        {receipt.category}
                      </Badge>
                    </div>

                    {receipt.bookingName && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{receipt.bookingName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(receipt.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  {receipt.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                    <div className="mt-3 rounded overflow-hidden border">
                      <img
                        src={receipt.url}
                        alt={receipt.name}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(receipt.url, "_blank")}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
