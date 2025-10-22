
import { useState } from "react";
import { Booking } from "@/types/booking";
import { formatCurrency } from "@/lib/bookingCalculations";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Calendar, DollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
}

export function BookingList({ bookings, onEdit, onDelete }: BookingListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      deposit_paid: "secondary",
      partial: "outline",
      paid: "default",
      refunded: "outline",
    };

    const labels: Record<string, string> = {
      pending: "Pending",
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

  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (bookings.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4">
        {sortedBookings.map((booking) => (
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
                    <p className="text-sm font-medium">{formatCurrency(booking.balanceDue)}</p>
                  </div>
                </div>
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
        ))}
      </div>

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
