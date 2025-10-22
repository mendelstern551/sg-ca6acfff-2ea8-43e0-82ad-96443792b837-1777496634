import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/booking";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { HDate, HebrewCalendar, months } from "hebcal";

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
}

const bookingTypeColors: { [key: string]: string } = {
  yom_tov: "bg-blue-500",
  shabaton: "bg-green-500",
  night_event: "bg-purple-500",
};

const bookingTypeLabels: { [key: string]: string } = {
  yom_tov: "Yom Tov",
  shabaton: "Shabaton",
  night_event: "Night Event",
};

export function BookingCalendar({ bookings, onDateClick, onBookingClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const bookingsByDate = bookings.reduce((acc, booking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    
    dates.forEach(date => {
      const key = format(date, "yyyy-MM-dd");
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(booking);
    });
    
    return acc;
  }, {} as Record<string, Booking[]>);

  const getHebrewDate = (date: Date): string => {
    try {
      const hDate = new HDate(date);
      return `${hDate.getDate()} ${hDate.getMonthName()}`;
    } catch (error) {
      return "";
    }
  };

  const getHebrewMonthYear = (date: Date): string => {
    try {
      const hDate = new HDate(date);
      return `${hDate.getMonthName()} ${hDate.getFullYear()}`;
    } catch (error) {
      return "";
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const selectedDateBookings = selectedDate 
    ? bookingsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Booking Calendar
            </CardTitle>
            <CardDescription>
              English & Hebrew dates - View all your bookings
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[180px] text-center">
                <div>{format(currentMonth, "MMMM yyyy")}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {getHebrewMonthYear(currentMonth)}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDate[dayKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hebrewDate = getHebrewDate(day);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`
                  relative h-24 p-2 rounded-lg border transition-all flex flex-col
                  ${isCurrentMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
                  ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-700"}
                  ${isToday ? "border-blue-400 bg-blue-50 dark:bg-blue-950" : ""}
                  ${dayBookings.length > 0 ? "hover:shadow-md" : ""}
                  ${!isCurrentMonth ? "opacity-40" : ""}
                  hover:border-slate-300 dark:hover:border-slate-600
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-left">
                    <div className="text-base font-semibold">
                      {format(day, "d")}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      {hebrewDate}
                    </div>
                  </div>
                  {isToday && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                {dayBookings.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`h-1.5 flex-1 rounded-full ${bookingTypeColors[booking.type] || "bg-gray-400"}`}
                        title={booking.name}
                      />
                    ))}
                    {dayBookings.length > 2 && (
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 w-full text-center">
                        +{dayBookings.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && selectedDateBookings.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-2">
              Bookings on {format(selectedDate, "MMMM d, yyyy")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Hebrew: {getHebrewDate(selectedDate)}
            </p>
            <div className="space-y-3">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onBookingClick?.(booking)}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium">{booking.name}</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {booking.contactName}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {bookingTypeLabels[booking.type] || booking.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>{booking.numberOfGuests} guests</span>
                    <span>•</span>
                    <span>
                      {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
