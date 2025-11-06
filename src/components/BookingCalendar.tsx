import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Booking } from "@/types/booking";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, Plus, Users, Clock } from "lucide-react";
import { HDate, HebrewCalendar, flags, gematriya } from "@hebcal/core";

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

  const bookingsByDate = bookings.reduce((acc, booking) => {
    try {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("❌ Invalid dates for booking:", booking.id, "Start:", booking.start_date, "End:", booking.end_date);
        return acc;
      }
      
      const dates = eachDayOfInterval({ start: startDate, end: endDate });
      
      dates.forEach(date => {
        const key = format(date, "yyyy-MM-dd");
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(booking);
      });
    } catch (error) {
      console.error("❌ Error processing booking dates:", booking.id, error);
    }
    
    return acc;
  }, {} as Record<string, Booking[]>);

  const getJewishHolidays = (date: Date) => {
    try {
      const hDate = new HDate(date);
      const events = HebrewCalendar.getHolidaysOnDate(hDate, false) || [];
      return events.filter((event: any) => {
        const mask = event.getFlags();
        return (mask & flags.MODERN_HOLIDAY) || (mask & flags.CHAG) || (mask & flags.MINOR_HOLIDAY);
      }).map((event: any) => {
        let hebrewText = event.render("he");
        hebrewText = hebrewText.replace(/[\u0591-\u05C7]/g, "");
        return {
          ...event,
          hebrewName: hebrewText,
          render: () => hebrewText
        };
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
      const monthNames: { [key: string]: string } = {
        "Nisan": "ניסן", "Iyyar": "אייר", "Sivan": "סיון", "Tamuz": "תמוז", "Av": "אב", "Elul": "אלול",
        "Tishrei": "תשרי", "Cheshvan": "חשון", "Kislev": "כסלו", "Tevet": "טבת", "Sh'vat": "שבט",
        "Adar": "אדר", "Adar I": "אדר א", "Adar II": "אדר ב"
      };
      
      const englishMonth = hDate.getMonthName();
      const yiddishMonth = monthNames[englishMonth] || englishMonth;
      const year = hDate.getFullYear();
      const hebrewYear = gematriya(year);
      
      return `${yiddishMonth} ${hebrewYear}`;
    } catch (error) {
      return "";
    }
  };

  const getParshaName = (date: Date): string => {
    try {
      if (date.getDay() !== 6) return "";
      const hDate = new HDate(date);
      const events = HebrewCalendar.calendar({ start: hDate, end: hDate, sedrot: true, noHolidays: false });
      const parshaEvent = events.find((event: any) => event.getDesc().startsWith("Parashat") || event.getDesc().includes("Torah"));
      
      if (parshaEvent) {
        let hebrewText = parshaEvent.render("he");
        hebrewText = hebrewText.replace("פרשת ", "");
        hebrewText = hebrewText.replace(/[\u0591-\u05C7]/g, "");
        return hebrewText;
      }
      return "";
    } catch (error) {
      console.error("Error getting Parsha:", error);
      return "";
    }
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const selectedDateBookings = selectedDate ? bookingsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];
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
              </CardTitle>
              <CardDescription>
                English & Hebrew dates with Jewish holidays • Click dates to add or view bookings
              </CardDescription>
            </div>
          </div>
          <div className="text-center mt-4">
            <div className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-hebrew">{getHebrewMonthYear(currentMonth)}</div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs flex-wrap">
            <div className="flex items-center gap-2"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span className="text-slate-600 dark:text-slate-400">Holiday</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500 border border-blue-600" /><span className="text-slate-600 dark:text-slate-400">Yom Tov (Confirmed)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500 border border-green-600" /><span className="text-slate-600 dark:text-slate-400">Shabaton (Confirmed)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500 border border-purple-600" /><span className="text-slate-600 dark:text-slate-400">Night Event (Confirmed)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-400 border border-orange-500" /><span className="text-slate-600 dark:text-slate-400">Pending</span></div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="default" 
              onClick={handlePreviousMonth}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 border-2"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>

            <div className="flex-1 px-16">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                  <div key={day} className="text-center py-2">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{day}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 font-hebrew">{["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"][i]}</div>
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

                  let dateBackgroundColor = "", borderColor = "", textColor = "";
                  const inlineStyle: React.CSSProperties = {};
                  
                  if (hasBookings) {
                    const hasPending = dayBookings.some(b => !b.confirmed);
                    const hasConfirmed = dayBookings.some(b => b.confirmed);
                    const confirmedBooking = dayBookings.find(b => b.confirmed);
                    
                    if (hasPending && !hasConfirmed) {
                      dateBackgroundColor = "bg-orange-300 dark:bg-orange-800/80";
                      borderColor = "border-orange-500 dark:border-orange-600 border-4";
                      textColor = "text-orange-900 dark:text-orange-100";
                    } else if (hasConfirmed && !hasPending && confirmedBooking) {
                      if (confirmedBooking.booking_type === "yom_tov") { dateBackgroundColor = "bg-blue-300 dark:bg-blue-800/80"; borderColor = "border-blue-500 dark:border-blue-600 border-4"; textColor = "text-blue-900 dark:text-blue-100"; }
                      else if (confirmedBooking.booking_type === "shabaton") { dateBackgroundColor = "bg-green-300 dark:bg-green-800/80"; borderColor = "border-green-500 dark:border-green-600 border-4"; textColor = "text-green-900 dark:text-green-100"; }
                      else if (confirmedBooking.booking_type === "night_event") { dateBackgroundColor = "bg-purple-300 dark:bg-purple-800/80"; borderColor = "border-purple-500 dark:border-purple-600 border-4"; textColor = "text-purple-900 dark:text-purple-100"; }
                    } else {
                      dateBackgroundColor = "bg-orange-300 dark:bg-orange-800/80";
                      borderColor = "border-orange-500 dark:border-orange-600 border-4";
                      textColor = "text-orange-900 dark:text-orange-100";
                    }
                  }

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDateClick(day)}
                      style={isCurrentMonth && hasBookings ? inlineStyle : undefined}
                      className={`relative min-h-[120px] p-2 rounded-lg border-2 transition-all flex flex-col
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
                        hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-left">
                          <div className={`text-base font-semibold ${hasBookings ? textColor : ""}`}>{format(day, "d")}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{hebrewDate}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasHoliday && (<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
                          {isToday && (<div className="w-2 h-2 rounded-full bg-blue-500" />)}
                        </div>
                      </div>

                      {isShabbat && parshaName && (<div className="mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md px-2 py-1.5 text-[11px] font-bold text-center shadow-sm border border-blue-600 font-hebrew">{parshaName}</div>)}
                      {hasHoliday && (<div className="text-[9px] text-yellow-700 dark:text-yellow-400 font-medium mb-1 line-clamp-1 font-hebrew">{holidays[0].hebrewName}</div>)}

                      {hasBookings && (
                        <div className="space-y-1 mt-auto flex-1 overflow-hidden">
                          {dayBookings.slice(0, 2).map((booking) => {
                            const colors = bookingTypeColors[booking.booking_type] || bookingTypeColors.yom_tov;
                            const colorClass = booking.confirmed ? colors.confirmed : colors.pending;
                            
                            return (
                              <div
                                key={booking.id}
                                className={`${colorClass} text-white rounded px-1.5 py-0.5 text-[9px] leading-tight border cursor-pointer hover:opacity-80 transition-opacity`}
                                onClick={(e) => { e.stopPropagation(); onBookingClick?.(booking); }}
                                title={`${booking.name} - ${booking.number_of_guests} guests`}
                              >
                                <div className="font-semibold truncate flex items-center gap-1">
                                  {!booking.confirmed && <Clock className="h-2 w-2 inline" />}
                                  {booking.contact_name}
                                </div>
                                <div className="flex items-center gap-1 opacity-90">
                                  <Users className="h-2 w-2" />
                                  {booking.number_of_guests}
                                </div>
                              </div>
                            );
                          })}
                          {dayBookings.length > 2 && (<div className="text-[9px] text-slate-600 dark:text-slate-400 text-center font-medium">+{dayBookings.length - 2} more</div>)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button 
              variant="outline" 
              size="default" 
              onClick={handleNextMonth}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 border-2"
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
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
            <DialogDescription>{selectedDate && `Hebrew: ${new HDate(selectedDate).renderGematriya()}`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDateHolidays.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><Star className="h-5 w-5 text-yellow-600 fill-yellow-600" /><span className="font-semibold text-yellow-900 dark:text-yellow-100">Jewish Holiday</span></div>
                <div className="space-y-1">{selectedDateHolidays.map((holiday: any, index: number) => (<p key={index} className="text-sm text-yellow-800 dark:text-yellow-200 font-hebrew">{holiday.hebrewName}</p>))}</div>
              </div>
            )}

            {selectedDateBookings.length > 0 ? (
              <div>
                <h5 className="text-sm font-semibold mb-3">Bookings on This Date</h5>
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} onClick={() => { onBookingClick?.(booking); setDateDialogOpen(false); }} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h6 className="font-semibold">{booking.name}</h6>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.contact_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={booking.confirmed ? "default" : "secondary"}>{booking.confirmed ? "Confirmed" : "Pending"}</Badge>
                          <Badge variant="outline">{bookingTypeLabels[booking.booking_type] || booking.booking_type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" />{booking.number_of_guests} guests</span>
                        <span>•</span>
                        <span>{format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400"><CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-sm">No bookings on this date</p></div>
            )}

            {onAddBooking && (<Button onClick={handleAddBookingForDate} className="w-full bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" />Add Booking for This Date</Button>)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}