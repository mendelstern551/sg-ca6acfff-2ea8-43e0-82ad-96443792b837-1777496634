import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Calendar, Trash2, Edit, FileText, ChevronDown, ChevronUp, 
  Eye, Mail, Edit2, MapPin, Users, DollarSign, Phone, Receipt, CreditCard, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { Expense, Booking, PaymentStatus } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  expenses: Expense[];
  onNavigateToExpenses: (bookingId: string) => void;
  onEditPayment?: (booking: Booking, payment: any) => void;
  onDeletePayment?: (paymentId: string, bookingId: string) => void;
}

export function BookingList({ bookings, onEdit, onDelete, onUpdateBooking, expenses, onNavigateToExpenses, onEditPayment, onDeletePayment }: BookingListProps) {
  const { toast } = useToast();
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [sendingFeedbackFor, setSendingFeedbackFor] = useState<string | null>(null);

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
    if (!booking.contact_email) {
      toast({
        title: "No email on file",
        description: "Add a contact email to this booking before sending a feedback request.",
        variant: "destructive",
      });
      return;
    }

    setSendingFeedbackFor(booking.id);
    try {
      const response = await fetch("/api/send-feedback-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          contactName: booking.contact_name,
          contactEmail: booking.contact_email,
          eventName: booking.name,
          checkOutDate: booking.end_date,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        toast({
          title: "Feedback request sent",
          description: `Email delivered to ${booking.contact_email}.`,
        });
      } else {
        toast({
          title: "Send failed",
          description: result?.error || `Server returned ${response.status}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending feedback request:", error);
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Could not reach the email service.",
        variant: "destructive",
      });
    } finally {
      setSendingFeedbackFor(null);
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
            {bookings.map((booking) => (
                <>
                  <TableRow key={booking.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50">
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
                      <TooltipProvider delayDuration={150}>
                        <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenClientDetails(booking)}
                                aria-label="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(booking)}
                                aria-label="Edit booking"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSendFeedback(booking)}
                                disabled={sendingFeedbackFor === booking.id}
                                aria-label="Send feedback request"
                              >
                                {sendingFeedbackFor === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send feedback request</TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleConfirm(booking)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                {booking.confirmed ? "Mark as Tentative" : "Confirm Booking"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onNavigateToExpenses(booking.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Expenses
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete(booking.id)}
                                className="text-red-600 dark:text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TooltipProvider>
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
                              <div className="space-y-2">
                                {booking.payments.map((payment: any) => (
                                  <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                    <div>
                                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                                      </span>
                                      {payment.payment_method && payment.payment_method !== "pending" && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {payment.payment_method.replace("_", " ")}
                                        </Badge>
                                      )}
                                    </div>
                                    <TooltipProvider delayDuration={150}>
                                      <div className="flex gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onEditPayment?.(booking, payment)}
                                              className="h-7 px-2"
                                              aria-label="Edit payment"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit payment</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                if (window.confirm(`Delete this ${formatCurrency(payment.amount)} payment?`)) {
                                                  onDeletePayment?.(payment.id, booking.id);
                                                }
                                              }}
                                              className="h-7 px-2 text-destructive hover:text-destructive"
                                              aria-label="Delete payment"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete payment</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TooltipProvider>
                                  </div>
                                ))}
                              </div>
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
          // key tied to booking.id forces a fresh mount when switching bookings —
          // otherwise ClientDetailsDialog's internal `useState(booking)` stays
          // pinned to the booking it first saw.
          key={selectedBookingForDetails.id}
          open={clientDetailsOpen}
          onOpenChange={(o) => {
            setClientDetailsOpen(o);
            // Drop the booking on close so the dialog unmounts cleanly.
            if (!o) setSelectedBookingForDetails(null);
          }}
          booking={selectedBookingForDetails}
          allExpenses={expenses}
          onNavigateToExpenses={onNavigateToExpenses}
        />
      )}
    </>
  );
}
