
import { useState } from "react";
import { Booking, Payment } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Users, Calendar, DollarSign, Clock, CheckCircle2, Plus, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PaymentDialog } from "./PaymentDialog";

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateBooking: (booking: Booking) => void;
}

const paymentMethodColors: Record<string, string> = {
  cash: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  check: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  credit_card: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  bank_transfer: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  venmo: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  zelle: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  venmo: "Venmo",
  zelle: "Zelle",
  other: "Other",
};

export function BookingList({ bookings, onEdit, onDelete, onUpdateBooking }: BookingListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | undefined>(undefined);

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case "yom_tov": return "Yom Tov";
      case "shabaton": return "Shabaton";
      case "night_event": return "Night Event";
      default: return type;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "destructive",
      confirmed: "default",
      deposit_paid: "secondary",
      partial: "outline",
      paid: "default",
      refunded: "outline",
    };

    const labels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      deposit_paid: "Deposit Paid",
      partial: "Partial Payment",
      paid: "Fully Paid",
      refunded: "Refunded",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleAddPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedPayment(undefined);
    setPaymentDialogOpen(true);
  };

  const handleEditPayment = (booking: Booking, payment: Payment) => {
    setSelectedBooking(booking);
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = (payment: Payment) => {
    if (!selectedBooking) return;

    const updatedBooking = { ...selectedBooking };
    
    if (!updatedBooking.payments) {
      updatedBooking.payments = [];
    }

    const existingIndex = updatedBooking.payments.findIndex(p => p.id === payment.id);
    
    if (existingIndex >= 0) {
      updatedBooking.payments[existingIndex] = payment;
    } else {
      updatedBooking.payments.push(payment);
    }

    const totalPaid = updatedBooking.payments.reduce((sum, p) => sum + p.amount, 0);
    updatedBooking.amountPaid = totalPaid;
    updatedBooking.balanceDue = updatedBooking.totalCost - totalPaid;

    if (totalPaid === 0) {
      updatedBooking.paymentStatus = "pending";
    } else if (totalPaid >= updatedBooking.totalCost) {
      updatedBooking.paymentStatus = "paid";
    } else if (totalPaid >= updatedBooking.depositAmount) {
      updatedBooking.paymentStatus = "partial";
    } else {
      updatedBooking.paymentStatus = "deposit_paid";
    }

    onUpdateBooking(updatedBooking);
  };

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingBookings = sortedBookings.filter(
    (b) => b.paymentStatus === "pending" || b.paymentStatus === "deposit_paid" || b.paymentStatus === "partial"
  );

  const confirmedBookings = sortedBookings.filter(
    (b) => b.paymentStatus === "confirmed" || b.paymentStatus === "paid"
  );

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{booking.name}</h3>
              <Badge variant="outline">{getBookingTypeLabel(booking.type)}</Badge>
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Contact: {booking.contactName} • {booking.contactEmail}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(booking)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(booking.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Dates</p>
              <p className="text-sm font-medium">
                {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Guests</p>
              <p className="text-sm font-medium">{booking.numberOfGuests} people</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Total Cost</p>
              <p className="text-sm font-medium">{formatCurrency(booking.totalCost)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Balance Due</p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-500">
                {formatCurrency(booking.balanceDue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Payments ({booking.payments?.length || 0})
            </h4>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={() => handleAddPayment(booking)}
            >
              <Plus className="h-3 w-3" />
              Add Payment
            </Button>
          </div>

          {booking.payments && booking.payments.length > 0 ? (
            <div className="space-y-2">
              {booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600 dark:text-green-500">
                          {formatCurrency(payment.amount)}
                        </span>
                        <Badge className={paymentMethodColors[payment.paymentMethod]} variant="secondary">
                          {paymentMethodLabels[payment.paymentMethod]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {format(new Date(payment.date), "MMM d, yyyy")}
                        </span>
                        {payment.referenceNumber && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              Ref: {payment.referenceNumber}
                            </span>
                          </>
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPayment(booking, payment)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium">Total Paid:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(booking.amountPaid)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
              No payments recorded yet
            </div>
          )}
        </div>

        {booking.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Notes:</span> {booking.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string, icon: React.ReactNode) => (
    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
      {icon}
      <p className="text-lg font-medium mb-2">{message}</p>
      <p className="text-sm">Check other tabs or create a new booking</p>
    </div>
  );

  if (bookings.length === 0) {
    return null;
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All Bookings
            <Badge variant="secondary" className="ml-1">
              {bookings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
            <Badge variant="destructive" className="ml-1">
              {pendingBookings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmed
            <Badge variant="default" className="ml-1">
              {confirmedBookings.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {sortedBookings.map(renderBookingCard)}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            renderEmptyState(
              "No pending bookings",
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            )
          ) : (
            pendingBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedBookings.length === 0 ? (
            renderEmptyState(
              "No confirmed bookings",
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            )
          ) : (
            confirmedBookings.map(renderBookingCard)
          )}
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          payment={selectedPayment}
          bookingId={selectedBooking.id}
          onSave={handleSavePayment}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
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
