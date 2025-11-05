
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, Trash2, Edit, FileText, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import { Booking, Payment, Expense, BookingType, PaymentStatus } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { ClientDetailsDialog } from "./ClientDetailsDialog";

// We need to define the MappedBooking type here as well, as it's passed from index.tsx
interface MappedBooking {
  id: string;
  bookingType: BookingType;
  name: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  startDate: string;
  endDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  baseRate: number;
  perPersonRate: number;
  cleaningFee: number;
  additionalCleaningFee: number;
  totalCost: number;
  depositAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  confirmed: boolean;
  payments: Payment[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customPrice: number | null;
  discountPercent: number | null;
}

interface BookingListProps {
  bookings: MappedBooking[];
  expenses: Expense[];
  onEdit: (booking: MappedBooking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateBooking: (booking: MappedBooking) => void;
  onNavigateToExpenses: (bookingId: string) => void;
}

export function BookingList({ bookings, expenses, onEdit, onDelete, onUpdateBooking, onNavigateToExpenses }: BookingListProps) {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<MappedBooking | null>(null);

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "partial": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "pending": return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const handleToggleConfirm = async (booking: MappedBooking) => {
    const updatedBooking = { ...booking, confirmed: !booking.confirmed };
    await onUpdateBooking(updatedBooking);
  };
  
  const handleOpenClientDetails = (booking: MappedBooking) => {
    setSelectedBookingForDetails(booking);
    setClientDetailsOpen(true);
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Client / Event</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Balance Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map((booking) => (
                <>
                  <TableRow key={booking.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleExpand(booking.id)}>
                        {expandedBookingId === booking.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.name}</div>
                      <div className="text-sm text-stone-600 dark:text-stone-400">{booking.contactName}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.startDate), "MMM d, yyyy")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{booking.numberOfGuests}</TableCell>
                    <TableCell>{formatCurrency(booking.totalCost)}</TableCell>
                    <TableCell className={booking.balanceDue > 0 ? "text-orange-600 dark:text-orange-400 font-medium" : "text-green-600 dark:text-green-400"}>
                      {formatCurrency(booking.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 items-start">
                        <Badge className={getStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </Badge>
                        <Badge variant={booking.confirmed ? "default" : "secondary"}>
                          {booking.confirmed ? "Confirmed" : "Tentative"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenClientDetails(booking)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(booking)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleConfirm(booking)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            {booking.confirmed ? "Mark as Tentative" : "Confirm Booking"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigateToExpenses(booking.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Expenses
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(booking.id)} className="text-red-600 dark:text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedBookingId === booking.id && (
                    <TableRow className="bg-stone-50 dark:bg-stone-800/30">
                      <TableCell colSpan={8}>
                        <div className="p-4 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Booking Notes</h4>
                            <p className="text-sm text-stone-600 dark:text-stone-400">{booking.notes || "No notes for this booking."}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Payment History</h4>
                            {booking.payments && booking.payments.length > 0 ? (
                              <ul className="space-y-2">
                                {booking.payments.map((payment) => (
                                  <li key={payment.id} className="text-sm flex justify-between">
                                    <span>
                                      {format(new Date(payment.payment_date), "MMM d, yyyy")} - {payment.payment_method}
                                    </span>
                                    <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-stone-500">No payments recorded yet.</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
          </TableBody>
        </Table>
      </div>
      {selectedBookingForDetails && (
        <ClientDetailsDialog 
          open={clientDetailsOpen}
          onOpenChange={setClientDetailsOpen}
          booking={selectedBookingForDetails}
          allExpenses={expenses}
          onNavigateToExpenses={onNavigateToExpenses}
        />
      )}
    </>
  );
}
</full_file-rewrite><full_file_rewrite file_path="src/components/ExpenseList.tsx">
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Expense, Booking } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";

interface ExpenseListProps {
  expenses: Expense[];
  bookings: Booking[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  filterBookingId?: string;
}

export function ExpenseList({ expenses, bookings, onEdit, onDelete, filterBookingId }: ExpenseListProps) {
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
    if (!bookingId) return "General";
    const booking = bookings.find((b) => b.id === bookingId);
    return booking?.name || "Unknown Booking";
  };

  const filteredExpenses = filterBookingId
    ? expenses.filter((e) => e.booking_id === filterBookingId)
    : expenses;

  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-800">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses
            .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
            .map((expense) => (
              <TableRow key={expense.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <TableCell>
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-stone-600 dark:text-stone-400">{expense.vendor}</div>
                </TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(expense.category)}>{expense.category}</Badge>
                </TableCell>
                <TableCell>{getBookingName(expense.booking_id)}</TableCell>
                <TableCell>{format(new Date(expense.expense_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(Number(expense.amount))}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(expense.id)} className="text-red-600 dark:text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
