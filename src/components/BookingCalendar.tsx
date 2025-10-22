
"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Booking } from "@/types/booking";
import { format } from "date-fns";

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
}

const bookingTypeColors: { [key: string]: string } = {
  "Yom Tov": "bg-blue-500",
  "Shabaton": "bg-green-500",
  "Night Event": "bg-purple-500",
};

export function BookingCalendar({ bookings, onDateClick, onBookingClick }: BookingCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const bookingDays = bookings.reduce((acc, booking) => {
    const bookingDate = new Date(booking.checkInDate);
    const key = format(bookingDate, "yyyy-MM-dd");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const DayWithBookings = ({ date }: { date: Date }) => {
    const dayKey = format(date, "yyyy-MM-dd");
    const dayBookings = bookingDays[dayKey] || [];

    const dayContent = (
      <div className="relative w-full h-full flex items-center justify-center">
        {format(date, "d")}
        {dayBookings.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
            {dayBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className={`h-1.5 w-1.5 rounded-full ${bookingTypeColors[booking.type] || "bg-gray-400"}`}
              />
            ))}
          </div>
        )}
      </div>
    );

    if (dayBookings.length > 0) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            {dayContent}
          </PopoverTrigger>
          <PopoverContent className="w-80 z-50">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">
                  Bookings for {format(date, "PPP")}
                </h4>
              </div>
              <div className="grid gap-2">
                {dayBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 cursor-pointer rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => onBookingClick?.(booking)}
                  >
                    <span className={`flex h-2 w-2 translate-y-1 rounded-full ${bookingTypeColors[booking.type]}`} />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">
                        {booking.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.type} - {booking.numberOfGuests} guests
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    return dayContent;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>
          View all your bookings in a calendar format. Hover over dates with dots for details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border p-4"
          components={{
            Day: DayWithBookings as any,
          }}
          onDayClick={(day, modifiers) => {
            if (!modifiers.disabled) {
              onDateClick?.(day)
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

