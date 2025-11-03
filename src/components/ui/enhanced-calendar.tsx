import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { HDate, HebrewCalendar, flags } from "@hebcal/core";

export type EnhancedCalendarProps = DayPickerProps;

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
        return (mask &amp; flags.MODERN_HOLIDAY) || (mask &amp; flags.CHAG) || (mask &amp; flags.MINOR_HOLIDAY);
      });
    } catch (error) {
      if (!(error instanceof Error &amp;&amp; error.message.includes("outside of range"))) {
        console.error("Error getting Jewish holidays:", error);
      }
      return [];
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
      if (!(error instanceof Error &amp;&amp; error.message.includes("outside of range"))) {
        console.error("Error getting Hebrew date:", error);
      }
      return "";
    }
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-slate-400",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&amp;:has([aria-selected])]:bg-slate-100 [&amp;:has([aria-selected].day-outside)]:bg-slate-100/50 [&amp;:has([aria-selected].day-range-end)]:rounded-r-md dark:[&amp;:has([aria-selected])]:bg-slate-800 dark:[&amp;:has([aria-selected].day-outside)]:bg-slate-800/50",
          props.mode === "range"
            ? "[&amp;:has(&gt;.day-range-end)]:rounded-r-md [&amp;:has(&gt;.day-range-start)]:rounded-l-md first:[&amp;:has([aria-selected])]:rounded-l-md last:[&amp;:has([aria-selected])]:rounded-r-md"
            : "[&amp;:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-16 w-9 p-0 font-normal aria-selected:opacity-100 flex flex-col items-center justify-center"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-slate-50 hover:bg-blue-600 hover:text-slate-50 focus:bg-blue-600 focus:text-slate-50 dark:bg-blue-600 dark:text-slate-50 dark:hover:bg-blue-600 dark:hover:text-slate-50 dark:focus:bg-blue-600 dark:focus:text-slate-50",
        day_today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        day_outside:
          "day-outside text-slate-500 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30 dark:text-slate-400 dark:aria-selected:bg-slate-800/50 dark:aria-selected:text-slate-400",
        day_disabled: "text-slate-500 opacity-50 dark:text-slate-400",
        day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => &lt;ChevronLeft className="h-4 w-4" /&gt;,
        IconRight: ({ ...props }) => &lt;ChevronRight className="h-4 w-4" /&gt;,
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
          const hasHoliday = holidays.length > 0;

          return (
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              {hasHoliday &amp;&amp; (
                <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
              <div className="text-base font-semibold">{date.getDate()}</div>
              {hebrewDate &amp;&amp; (
                <div className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                  {hebrewDate}
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
