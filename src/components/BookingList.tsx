import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, Trash2, Edit, FileText, ChevronDown, ChevronUp, Eye, Mail } from "lucide-react";
import { format } from "date-fns";
import { Expense, Booking, PaymentStatus } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { ClientDetailsDialog } from "./ClientDetailsDialog";

interface BookingListProps {
  bookings: Booking[];
  expenses: Expense[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  onNavigateToExpenses: (bookingId: string) => void;
}

export function BookingList({ bookings, expenses, onEdit, onDelete, onUpdateBooking, onNavigateToExpenses }: BookingListProps) {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

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

  const handleToggleConfirm = async (booking: Booking) => {
    const updatedBooking = { ...booking, confirmed: !booking.confirmed };
    await onUpdateBooking(updatedBooking);
  };
  
  const handleOpenClientDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setClientDetailsOpen(true);
  };

  const handleSendFeedback = async (booking: Booking) => {
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
        alert(`✅ Feedback request email sent successfully to ${booking.contact_email}`);
      } else {
        alert(`❌ Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending feedback request:", error);
      alert("❌ Failed to send feedback request email");
    }
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
              .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
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
                      <div className="text-sm text-stone-600 dark:text-stone-400">{booking.contact_name}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.start_date), "MMM d, yyyy")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{booking.number_of_guests}</TableCell>
                    <TableCell>{formatCurrency(booking.total_cost)}</TableCell>
                    <TableCell className={booking.balance_due > 0 ? "text-orange-600 dark:text-orange-400 font-medium" : "text-green-600 dark:text-green-400"}>
                      {formatCurrency(booking.balance_due)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 items-start">
                        <Badge className={getStatusColor(booking.payment_status as PaymentStatus)}>
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
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
                          <DropdownMenuItem onClick={() => handleSendFeedback(booking)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Feedback Request
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
