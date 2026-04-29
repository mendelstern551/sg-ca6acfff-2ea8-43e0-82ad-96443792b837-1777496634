import { useState, useEffect } from "react";
import { Expense, Booking } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Image, Search, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExpenseListProps {
  expenses: Expense[];
  bookings: Booking[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  filterBookingId?: string;
}

export function ExpenseList({ expenses, bookings, onEdit, onDelete, filterBookingId }: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<string>(filterBookingId || "all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (filterBookingId) {
      setSelectedBooking(filterBookingId);
    }
  }, [filterBookingId]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Food & Catering",
      cleaning: "Cleaning & Maintenance",
      supplies: "Supplies",
      utilities: "Utilities",
      staff: "Staff & Labor",
      equipment: "Equipment",
      "Manager Salary": "Manager Salary",
      other: "Other",
    };
    return labels[category] || category;
  };

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

  const getBookingName = (bookingId?: string | null) => {
    if (!bookingId) return "General Expense";
    const booking = bookings.find((b) => b.id === bookingId);
    return booking ? booking.name : "Unknown Booking";
  };

  // Parent already sorts via TableFilters; preserve incoming order.
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchQuery === "" || 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.vendor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    const matchesBooking = selectedBooking === "all" || expense.booking_id === selectedBooking;

    const min = minAmount ? parseFloat(minAmount) : 0;
    const max = maxAmount ? parseFloat(maxAmount) : Infinity;
    const matchesAmount = expense.amount >= min && expense.amount <= max;

    return matchesSearch && matchesCategory && matchesBooking && matchesAmount;
  });

  const categories = ["all", "food", "cleaning", "supplies", "utilities", "staff", "equipment", "Manager Salary", "other"];

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {filterBookingId && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Showing expenses for: {getBookingName(filterBookingId)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBooking("all")}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.filter(c => c !== "all").map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBooking} onValueChange={setSelectedBooking}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by booking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            {bookings.map((booking) => (
              <SelectItem key={booking.id} value={booking.id}>
                {booking.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min $"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Max $"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      {(searchQuery || selectedCategory !== "all" || selectedBooking !== "all" || minAmount || maxAmount) && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <p>
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              if (!filterBookingId) {
                setSelectedBooking("all");
              }
              setMinAmount("");
              setMaxAmount("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No expenses found</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{expense.description}</h3>
                      <Badge className={getCategoryColor(expense.category)}>
                        {getCategoryLabel(expense.category)}
                      </Badge>
                      <Badge variant="outline">{getBookingName(expense.booking_id)}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Vendor: {expense.vendor} • {expense.payment_method?.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(expense.expense_date), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Amount</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {expense.receipt_urls && expense.receipt_urls.length > 0 && expense.receipt_urls.map((url, index) => (
                      <Button
                        key={`receipt-${index}`}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <Image className="h-4 w-4 mr-1" />
                        Receipt {expense.receipt_urls.length > 1 ? index + 1 : ""}
                      </Button>
                    ))}
                    {expense.proof_urls && expense.proof_urls.length > 0 && expense.proof_urls.map((url, index) => (
                      <Button
                        key={`proof-${index}`}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Proof {expense.proof_urls.length > 1 ? index + 1 : ""}
                      </Button>
                    ))}
                  </div>
                </div>

                {expense.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Notes:</span> {expense.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
