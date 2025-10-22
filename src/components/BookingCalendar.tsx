import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/booking";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star } from "lucide-react";
import { HDate, HebrewCalendar, flags } from "@hebcal/core";

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

  const getJewishHolidays = (date: Date) => {
    try {
      const hDate = new HDate(date);
      const events = HebrewCalendar.getHolidaysOnDate(hDate, false) || [];
      return events.filter((event: any) => {
        const mask = event.getFlags();
        return (mask & flags.FAST_DAY) || (mask & flags.MODERN_HOLIDAY) || (mask & flags.CHAG) || (mask & flags.MINOR_HOLIDAY);
      });
    } catch (error) {
      console.error("Error getting holidays:", error);
      return [];
    }
  };

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

  const selectedDateHolidays = selectedDate ? getJewishHolidays(selectedDate) : [];

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
              English & Hebrew dates with Jewish holidays
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
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-slate-600 dark:text-slate-400">Jewish Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">Yom Tov</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded-full bg-green-500" />
            <span className="text-slate-600 dark:text-slate-400">Shabaton</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">Night Event</span>
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
            const holidays = getJewishHolidays(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hebrewDate = getHebrewDate(day);
            const hasHoliday = holidays.length > 0;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`
                  relative h-28 p-2 rounded-lg border transition-all flex flex-col
                  ${isCurrentMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
                  ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-700"}
                  ${isToday ? "border-blue-400 bg-blue-50 dark:bg-blue-950" : ""}
                  ${hasHoliday ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700" : ""}
                  ${dayBookings.length > 0 || hasHoliday ? "hover:shadow-md" : ""}
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
                  <div className="flex items-center gap-1">
                    {hasHoliday && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                    {isToday && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>

                {hasHoliday && (
                  <div className="text-[9px] text-yellow-700 dark:text-yellow-400 font-medium mb-1 line-clamp-1">
                    {holidays[0].render()}
                  </div>
                )}

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

        {selectedDate && (selectedDateBookings.length > 0 || selectedDateHolidays.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-2">
              {format(selectedDate, "MMMM d, yyyy")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Hebrew: {getHebrewDate(selectedDate)}
            </p>

            {selectedDateHolidays.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    Jewish Holiday
                  </span>
                </div>
                <div className="space-y-1">
                  {selectedDateHolidays.map((holiday: any, index: number) => (
                    <p key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                      {holiday.render()}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {selectedDateBookings.length > 0 && (
              <>
                <h5 className="text-sm font-medium mb-3">Bookings</h5>
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
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
