import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HDate, HebrewCalendar, flags, Sedra, months } from "@hebcal/core";

export type EnhancedCalendarProps = DayPickerProps;

// Short bilingual weekday labels. The previous full Hebrew strings
// ("יום ראשון" etc.) were too wide for the head cells and wrapped onto
// two cramped lines. These compact bilingual labels (English short-form
// + Hebrew single-letter abbreviation, e.g., "Sun · א׳") read clearly at
// any sensible cell width.
const ENGLISH_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEBREW_WEEKDAY_ABBR = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: EnhancedCalendarProps) {

  const getJewishHolidays = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return [];
      }
      const hDate = new HDate(date);
      const events = HebrewCalendar.getHolidaysOnDate(hDate, false) || [];
      return events.filter((event: any) => {
        const mask = event.getFlags();
        return (mask & flags.MODERN_HOLIDAY) || (mask & flags.CHAG) || (mask & flags.MINOR_HOLIDAY);
      });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("outside of range"))) {
        console.error("Error getting Jewish holidays:", error);
      }
      return [];
    }
  };

  const getParshaName = (date: Date): string => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 6) return "";
      
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
      return "";
    }
  };

  const getHebrewDate = (date: Date): string => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }
      const hDate = new HDate(date);
      return `${hDate.getDate()}`;
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("outside of range"))) {
        console.error("Error getting Hebrew date:", error);
      }
      return "";
    }
  };

  const formatWeekday = (date: Date, options?: any): string => {
    const dayIndex = date.getDay();
    // English short form + Hebrew letter abbreviation. Renders on a single
    // line at ~64px head_cell width and stays legible.
    return `${ENGLISH_WEEKDAYS[dayIndex]} · ${HEBREW_WEEKDAY_ABBR[dayIndex]}`;
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      formatters={{
        formatWeekdayName: formatWeekday,
      }}
      classNames={{
        // Two-month layout: side-by-side on tablet/desktop, stacked on
        // phones. Bigger gap so the months don't visually merge.
        months: "flex flex-col md:flex-row gap-6 justify-center",
        month: "space-y-3",
        caption: "flex justify-center pt-1 pb-2 relative items-center border-b",
        caption_label: "text-base font-semibold tracking-tight",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 hover:bg-accent rounded-full"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        // Wider head cells so "Sun · א׳" fits on one line; matches day cell
        // width below so the columns line up visually.
        head_cell:
          "text-muted-foreground w-14 font-medium text-[11px] tracking-tight py-2 whitespace-nowrap",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10 dark:[&:has([aria-selected])]:bg-primary/20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day: cn(
          // Square-ish cells, wider to match head_cell, slightly shorter on
          // mobile so two months fit without dialog overflow.
          "h-14 w-14 sm:h-16 sm:w-14 p-0 font-normal rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100 flex flex-col items-center justify-center"
        ),
        day_range_start:
          "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-l-lg",
        day_range_end:
          "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-r-lg",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today:
          "ring-2 ring-primary/40 ring-offset-1 ring-offset-background font-semibold",
        day_outside:
          "day-outside text-muted-foreground/40 aria-selected:text-muted-foreground/40",
        day_disabled: "text-muted-foreground/30 line-through",
        day_range_middle:
          "aria-selected:bg-primary/15 aria-selected:text-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        DayContent: ({ date }) => {
          if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="text-base font-semibold">-</div>
              </div>
            );
          }

          const holidays = getJewishHolidays(date);
          const hebrewDate = getHebrewDate(date);
          const parshaName = getParshaName(date);
          const isShabbos = date.getDay() === 6;

          return (
            <div className="flex flex-col items-center justify-center w-full h-full relative gap-0.5 px-0.5 py-1">
              <div className="text-[15px] font-semibold leading-none">{date.getDate()}</div>
              {hebrewDate && (
                <div className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                  {hebrewDate}
                </div>
              )}
              {parshaName && (
                <div className="text-[8.5px] font-semibold leading-tight px-1 py-0.5 mt-0.5 rounded-sm bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 max-w-full truncate">
                  {parshaName}
                </div>
              )}
              {holidays.length > 0 && (
                <div className="text-[8.5px] font-semibold leading-tight px-1 py-0.5 mt-0.5 rounded-sm bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 max-w-full truncate">
                  {holidays[0].render("he-x-NoNikud")}
                </div>
              )}
            </div>
          );
        },
      }}
      {...props}
    />
  );
}

EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };
