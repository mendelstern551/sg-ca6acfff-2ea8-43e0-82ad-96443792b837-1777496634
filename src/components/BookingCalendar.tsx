import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Booking } from "@/types/booking";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, Plus, Users, Clock } from "lucide-react";
import { HDate, HebrewCalendar, flags } from "@hebcal/core";
import { stripNikud } from "@hebcal/core";

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onAddBooking?: (date: Date) => void;
}

const bookingTypeColors: { [key: string]: { confirmed: string; pending: string } } = {
  yom_tov: { 
    confirmed: "bg-blue-500 border-blue-600", 
    pending: "bg-orange-400 border-orange-500" 
  },
  shabaton: { 
    confirmed: "bg-green-500 border-green-600", 
    pending: "bg-orange-400 border-orange-500" 
  },
  night_event: { 
    confirmed: "bg-purple-500 border-purple-600", 
    pending: "bg-orange-400 border-orange-500" 
  },
};

const bookingTypeLabels: { [key: string]: string } = {
  yom_tov: "Yom Tov",
  shabaton: "Shabaton",
  night_event: "Night Event",
};

export function BookingCalendar({ bookings, onDateClick, onBookingClick, onAddBooking }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  // Helper for debug panel to safely format dates
  const formatDebugDate = (date: string | Date | undefined): string => {
    if (!date) return "Not set";
    if (date instanceof Date) {
      return date.toISOString(); // Use ISO string for clarity
    }
    return date; // It's already a string
  };

  // Debug: Log bookings data when component mounts or bookings change
  useEffect(() => {
    console.log("BookingCalendar received bookings:", bookings);
    console.log("Total bookings:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking:", bookings[0]);
      console.log("Start date:", bookings[0].startDate, "Type:", typeof bookings[0].startDate);
      console.log("End date:", bookings[0].endDate, "Type:", typeof bookings[0].endDate);
    }
  }, [bookings]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const bookingsByDate = bookings.reduce((acc, booking) => {
    try {
      // Parse dates - handle both string and Date objects
      let startDate: Date;
      let endDate: Date;
      
      if (typeof booking.startDate === 'string') {
        startDate = new Date(booking.startDate);
      } else {
        startDate = booking.startDate;
      }
      
      if (typeof booking.endDate === 'string') {
        endDate = new Date(booking.endDate);
      } else {
        endDate = booking.endDate;
      }
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("❌ Invalid dates for booking:", booking.id, "Start:", booking.startDate, "End:", booking.endDate);
        return acc;
      }
      
      console.log("✅ Processing booking:", booking.name, "from", format(startDate, "yyyy-MM-dd"), "to", format(endDate, "yyyy-MM-dd"));
      
      // Get all dates in the booking range
      const dates = eachDayOfInterval({ start: startDate, end: endDate });
      console.log("  → Spans", dates.length, "days");
      
      dates.forEach(date => {
        const key = format(date, "yyyy-MM-dd");
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(booking);
        console.log("  → Added to date:", key);
      });
    } catch (error) {
      console.error("❌ Error processing booking dates:", booking.id, error);
    }
    
    return acc;
  }, {} as Record<string, Booking[]>);

  // Debug: Log processed bookings by date
  useEffect(() => {
    console.log("📅 Bookings by date:", bookingsByDate);
    console.log("📊 Number of dates with bookings:", Object.keys(bookingsByDate).length);
    console.log("📋 Date keys:", Object.keys(bookingsByDate));
  }, [bookingsByDate]);

  const getJewishHolidays = (date: Date) => {
    try {
      const hDate = new HDate(date);
      const events = HebrewCalendar.getHolidaysOnDate(hDate, false) || [];
      return events.filter((event: any) => {
        const mask = event.getFlags();
        return (mask & flags.MODERN_HOLIDAY) || (mask & flags.CHAG) || (mask & flags.MINOR_HOLIDAY);
      });
    } catch (error) {
      return [];
    }
  };

  const getHebrewDate = (date: Date): string => {
    try {
      const hDate = new HDate(date);
      return `${hDate.getDate()}`;
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

  const getParshaName = (date: Date): string => {
    try {
      // Only get parsha for Saturdays
      if (date.getDay() !== 6) return "";
      
      const hDate = new HDate(date);
      // Use HebrewCalendar.calendar with sedrot flag to get Torah readings
      const events = HebrewCalendar.calendar({
        start: hDate,
        end: hDate,
        sedrot: true,
        noHolidays: false,
      });
      
      // Look for Parashat event in the results
      const parshaEvent = events.find((event: any) => {
        const desc = event.getDesc();
        return desc.startsWith("Parashat") || desc.includes("Torah");
      });
      
      if (parshaEvent) {
        // Get Hebrew rendering with 'he' locale
        let hebrewText = parshaEvent.render("he");
        // Remove "פרשת " prefix if present to get just the parsha name
        hebrewText = hebrewText.replace("פרשת ", "");
        // Remove nikud (vowel points) using regex
        hebrewText = hebrewText.replace(/[\u0591-\u05C7]/g, "");
        return hebrewText;
      }
      
      return "";
    } catch (error) {
      console.error("Error getting Parsha:", error);
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
    setDateDialogOpen(true);
    onDateClick?.(date);
  };

  const handleAddBookingForDate = () => {
    if (selectedDate && onAddBooking) {
      onAddBooking(selectedDate);
      setDateDialogOpen(false);
    }
  };

  const selectedDateBookings = selectedDate 
    ? bookingsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const selectedDateHolidays = selectedDate ? getJewishHolidays(selectedDate) : [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Booking Calendar
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} loaded
                  </Badge>
                )}
                {Object.keys(bookingsByDate).length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {Object.keys(bookingsByDate).length} day{Object.keys(bookingsByDate).length !== 1 ? 's' : ''} with bookings
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                English & Hebrew dates with Jewish holidays • Click dates to add or view bookings
              </CardDescription>
              
              {/* DEBUG PANEL REMOVED - Calendar working correctly */}
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
          <div className="flex items-center gap-4 mt-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-slate-600 dark:text-slate-400">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600" />
              <span className="text-slate-600 dark:text-slate-400">Yom Tov (Confirmed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500 border border-green-600" />
              <span className="text-slate-600 dark:text-slate-400">Shabaton (Confirmed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500 border border-purple-600" />
              <span className="text-slate-600 dark:text-slate-400">Night Event (Confirmed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-400 border border-orange-500" />
              <span className="text-slate-600 dark:text-slate-400">Pending</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {[
              { en: "Sun", he: "ראשון" },
              { en: "Mon", he: "שני" },
              { en: "Tue", he: "שלישי" },
              { en: "Wed", he: "רביעי" },
              { en: "Thu", he: "חמישי" },
              { en: "Fri", he: "שישי" },
              { en: "Sat", he: "שבת" }
            ].map((day) => (
              <div key={day.en} className="text-center py-2">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {day.en}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 font-hebrew">
                  {day.he}
                </div>
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
              const hasBookings = dayBookings.length > 0;
              const parshaName = getParshaName(day);
              const isShabbat = day.getDay() === 6;

              // Determine background color based on booking status - STRONGER COLORS
              let dateBackgroundColor = "";
              let borderColor = "";
              let textColor = "";
              let inlineStyle: React.CSSProperties = {};
              
              if (hasBookings) {
                const hasPending = dayBookings.some(b => !b.confirmed);
                const hasConfirmed = dayBookings.some(b => b.confirmed);
                
                if (hasPending && !hasConfirmed) {
                  // Only pending bookings - STRONG orange marking
                  dateBackgroundColor = "bg-orange-300 dark:bg-orange-800/80";
                  borderColor = "border-orange-500 dark:border-orange-600 border-4";
                  textColor = "text-orange-900 dark:text-orange-100";
                  inlineStyle = { backgroundColor: "rgb(253 186 116)" }; // orange-300
                } else if (hasConfirmed && !hasPending) {
                  // Only confirmed bookings - use booking type color with STRONGER tint
                  const confirmedBooking = dayBookings.find(b => b.confirmed);
                  if (confirmedBooking) {
                    if (confirmedBooking.bookingType === "yom_tov") {
                      dateBackgroundColor = "bg-blue-300 dark:bg-blue-800/80";
                      borderColor = "border-blue-500 dark:border-blue-600 border-4";
                      textColor = "text-blue-900 dark:text-blue-100";
                      inlineStyle = { backgroundColor: "rgb(147 197 253)" }; // blue-300
                    } else if (confirmedBooking.bookingType === "shabaton") {
                      dateBackgroundColor = "bg-green-300 dark:bg-green-800/80";
                      borderColor = "border-green-500 dark:border-green-600 border-4";
                      textColor = "text-green-900 dark:text-green-100";
                      inlineStyle = { backgroundColor: "rgb(134 239 172)" }; // green-300
                    } else if (confirmedBooking.bookingType === "night_event") {
                      dateBackgroundColor = "bg-purple-300 dark:bg-purple-800/80";
                      borderColor = "border-purple-500 dark:border-purple-600 border-4";
                      textColor = "text-purple-900 dark:text-purple-100";
                      inlineStyle = { backgroundColor: "rgb(216 180 254)" }; // purple-300
                    }
                  }
                } else {
                  // Mix of pending and confirmed - use orange to indicate pending items
                  dateBackgroundColor = "bg-orange-300 dark:bg-orange-800/80";
                  borderColor = "border-orange-500 dark:border-orange-600 border-4";
                  textColor = "text-orange-900 dark:text-orange-100";
                  inlineStyle = { backgroundColor: "rgb(253 186 116)" }; // orange-300
                }
              }

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  style={isCurrentMonth && hasBookings ? inlineStyle : undefined}
                  className={`
                    relative min-h-[120px] p-2 rounded-lg border-2 transition-all flex flex-col
                    ${!isCurrentMonth ? "bg-slate-50 dark:bg-slate-800/50 opacity-40" : ""}
                    ${isCurrentMonth && !hasBookings && !hasHoliday && !isToday ? "bg-white dark:bg-slate-900" : ""}
                    ${isCurrentMonth && !hasBookings && hasHoliday ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                    ${isCurrentMonth && !hasBookings && isToday ? "bg-blue-50 dark:bg-blue-950" : ""}
                    ${isCurrentMonth && hasBookings ? dateBackgroundColor : ""}
                    ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
                    ${!isSelected && hasBookings ? borderColor : ""}
                    ${!isSelected && !hasBookings && isToday ? "border-blue-400" : ""}
                    ${!isSelected && !hasBookings && hasHoliday ? "border-yellow-300 dark:border-yellow-700" : ""}
                    ${!isSelected && !hasBookings && !hasHoliday && !isToday ? "border-slate-200 dark:border-slate-700" : ""}
                    ${hasBookings || hasHoliday ? "hover:shadow-md" : ""}
                    hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-left">
                      <div className={`text-base font-semibold ${hasBookings ? textColor : ""}`}>
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

                  {isShabbat && parshaName && (
                    <div className="mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md px-2 py-1.5 text-[11px] font-bold text-center shadow-sm border border-blue-600 font-hebrew">
                      📖 {parshaName}
                    </div>
                  )}

                  {hasHoliday && (
                    <div className="text-[9px] text-yellow-700 dark:text-yellow-400 font-medium mb-1 line-clamp-1">
                      {holidays[0].render()}
                    </div>
                  )}

                  {hasBookings && (
                    <div className="space-y-1 mt-auto flex-1 overflow-hidden">
                      {dayBookings.slice(0, 2).map((booking) => {
                        const colors = bookingTypeColors[booking.bookingType] || bookingTypeColors.yom_tov;
                        const colorClass = booking.confirmed ? colors.confirmed : colors.pending;
                        
                        return (
                          <div
                            key={booking.id}
                            className={`${colorClass} text-white rounded px-1.5 py-0.5 text-[9px] leading-tight border cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookingClick?.(booking);
                            }}
                            title={`${booking.name} - ${booking.numberOfGuests} guests`}
                          >
                            <div className="font-semibold truncate flex items-center gap-1">
                              {!booking.confirmed && <Clock className="h-2 w-2 inline" />}
                              {booking.contactName}
                            </div>
                            <div className="flex items-center gap-1 opacity-90">
                              <Users className="h-2 w-2" />
                              {booking.numberOfGuests}
                            </div>
                          </div>
                        );
                      })}
                      {dayBookings.length > 2 && (
                        <div className="text-[9px] text-slate-600 dark:text-slate-400 text-center font-medium">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && `Hebrew: ${getHebrewDate(selectedDate)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDateHolidays.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-100">
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

            {selectedDateBookings.length > 0 ? (
              <div>
                <h5 className="text-sm font-semibold mb-3">Bookings on This Date</h5>
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => {
                        onBookingClick?.(booking);
                        setDateDialogOpen(false);
                      }}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h6 className="font-semibold">{booking.name}</h6>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {booking.contactName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={booking.confirmed ? "default" : "secondary"}>
                            {booking.confirmed ? "Confirmed" : "Pending"}
                          </Badge>
                          <Badge variant="outline">
                            {bookingTypeLabels[booking.bookingType] || booking.bookingType}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {booking.numberOfGuests} guests
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No bookings on this date</p>
              </div>
            )}

            {onAddBooking && (
              <Button
                onClick={handleAddBookingForDate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Booking for This Date
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
