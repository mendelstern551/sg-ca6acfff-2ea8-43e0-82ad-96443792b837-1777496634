
import { useState } from "react";
import { Expense, Booking } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Image, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ExpenseListProps {
  expenses: Expense[];
  bookings: Booking[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseList({ expenses, bookings, onEdit, onDelete }: ExpenseListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Food & Catering",
      cleaning: "Cleaning & Maintenance",
      supplies: "Supplies",
      utilities: "Utilities",
      staff: "Staff & Labor",
      equipment: "Equipment",
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
      other: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[category] || colors.other;
  };

  const getBookingName = (bookingId?: string) => {
    if (!bookingId) return "General Expense";
    const booking = bookings.find((b) => b.id === bookingId);
    return booking ? booking.name : "Unknown Booking";
  };

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (expenses.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4">
        {sortedExpenses.map((expense) => (
          <Card key={expense.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{expense.description}</h3>
                    <Badge className={getCategoryColor(expense.category)}>
                      {getCategoryLabel(expense.category)}
                    </Badge>
                    <Badge variant="outline">{getBookingName(expense.bookingId)}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Vendor: {expense.vendor} • {expense.paymentMethod.replace("_", " ")}
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
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Amount</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {expense.receiptUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(expense.receiptUrl, "_blank")}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  )}
                  {expense.proofOfPaymentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(expense.proofOfPaymentUrl, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Proof
                    </Button>
                  )}
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
    </>
  );
}
