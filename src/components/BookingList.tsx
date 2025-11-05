import { useState } from "react";
import { Booking, Payment, Expense } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Users, Calendar, DollarSign, Clock, CheckCircle2, Eye, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { PaymentDialog } from "./PaymentDialog";

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  expenses?: Expense[];
  onNavigateToExpenses?: (bookingId: string) => void;
}

export function BookingList({ 
  bookings, 
  onEdit, 
  onDelete, 
  onUpdateBooking, 
  expenses = [],
  onNavigateToExpenses 
}: BookingListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const [currentBookingForPayment, setCurrentBookingForPayment] = useState<Booking | null>(null);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleAddPayment = (booking: Booking) => {
    setCurrentBookingForPayment(booking);
    setEditingPayment(undefined);
    setPaymentDialogOpen(true);
  };

  const handleEditPayment = (booking: Booking, payment: Payment) => {
    setCurrentBookingForPayment(booking);
    setEditingPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = (payment: Payment) => {
    if (!currentBookingForPayment) return;

    const existingPayments = currentBookingForPayment.payments || [];
    let updatedPayments: Payment[];

    if (editingPayment) {
      updatedPayments = existingPayments.map(p => p.id === payment.id ? payment : p);
    } else {
      updatedPayments = [...existingPayments, payment];
    }

    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const updatedBooking: Booking = {
      ...currentBookingForPayment,
      payments: updatedPayments,
      amountPaid: totalPaid,
      balanceDue: currentBookingForPayment.totalCost - totalPaid
    };

    onUpdateBooking(updatedBooking);
    setPaymentDialogOpen(false);
    setEditingPayment(undefined);
    setCurrentBookingForPayment(null);
  };

  const renderBookingCard = (booking: Booking) => {
    const payments = booking.payments || [];
    const sortedPayments = [...payments].sort((a, b) => 
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    return (
      <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-grow">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Customer</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.contactName}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                        className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="text-xs">Details</span>
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">{booking.contactEmail}</p>
                  </div>
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

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Payments ({payments.length})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddPayment(booking)}
                className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Payment
              </Button>
            </div>

            {payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-3 bg-slate-50 dark:bg-slate-900 rounded">
                No payments recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {sortedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => handleEditPayment(booking, payment)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(payment.payment_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {payment.payment_method.replace("_", " ")}
                        </Badge>
                        {payment.notes && (
                          <span className="text-xs text-slate-500">
                            Notes: {payment.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
  };

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
  
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingBookings = sortedBookings.filter(
    (b) => !b.confirmed
  );

  const confirmedBookings = sortedBookings.filter(
    (b) => b.confirmed === true
  );


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

        <TabsContent value="all">
          <div className="space-y-4">
            {sortedBookings.map(renderBookingCard)}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingBookings.length > 0 
                ? pendingBookings.map(renderBookingCard) 
                : renderEmptyState("No Pending Bookings", <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />)
            }
          </div>
        </TabsContent>

        <TabsContent value="confirmed">
          <div className="space-y-4">
            {confirmedBookings.length > 0 
                ? confirmedBookings.map(renderBookingCard)
                : renderEmptyState("No Confirmed Bookings", <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />)
            }
          </div>
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <ClientDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          booking={selectedBooking}
          allExpenses={expenses}
          onNavigateToExpenses={onNavigateToExpenses}
        />
      )}

      {currentBookingForPayment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          payment={editingPayment}
          bookingId={currentBookingForPayment.id}
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
