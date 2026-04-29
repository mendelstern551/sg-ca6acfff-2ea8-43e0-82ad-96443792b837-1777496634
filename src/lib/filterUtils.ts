import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays, nextFriday, nextSunday, isFriday, isSaturday, isSunday } from "date-fns";

export type SortOrder = "latest" | "oldest";
export type DateFilter = "all" | "today" | "week" | "month" | "custom" | "next7" | "next30" | "thisWeekend";

export function getDateRange(filter: DateFilter, customRange?: { from?: Date; to?: Date }) {
  const now = new Date();

  switch (filter) {
    case "today":
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn: 0 }),
        to: endOfWeek(now, { weekStartsOn: 0 }),
      };
    case "month":
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };
    case "next7":
      return {
        from: startOfDay(now),
        to: endOfDay(addDays(now, 7)),
      };
    case "next30":
      return {
        from: startOfDay(now),
        to: endOfDay(addDays(now, 30)),
      };
    case "thisWeekend": {
      // "Weekend" = Friday → Sunday inclusive. If today already is Fri/Sat/Sun, anchor to today.
      const friday = isFriday(now) || isSaturday(now) || isSunday(now)
        ? (isFriday(now) ? now : addDays(now, isSaturday(now) ? -1 : -2))
        : nextFriday(now);
      const sunday = isSunday(now) ? now : nextSunday(friday);
      return { from: startOfDay(friday), to: endOfDay(sunday) };
    }
    case "custom":
      return customRange || { from: undefined, to: undefined };
    default:
      return { from: undefined, to: undefined };
  }
}

export function isDateInRange(date: string | Date | null | undefined, range: { from?: Date; to?: Date }): boolean {
  if (!date) return true;
  if (!range.from && !range.to) return true;

  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (range.from && range.to) {
    return isWithinInterval(dateObj, { start: range.from, end: range.to });
  } else if (range.from) {
    return dateObj >= range.from;
  } else if (range.to) {
    return dateObj <= range.to;
  }

  return true;
}

export function sortByDate<T>(
  items: T[],
  getDate: (item: T) => string | Date | null | undefined,
  order: SortOrder
): T[] {
  return [...items].sort((a, b) => {
    const dateA = getDate(a);
    const dateB = getDate(b);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const timeA = typeof dateA === "string" ? new Date(dateA).getTime() : dateA.getTime();
    const timeB = typeof dateB === "string" ? new Date(dateB).getTime() : dateB.getTime();

    return order === "latest" ? timeB - timeA : timeA - timeB;
  });
}

export function searchInFields(item: any, searchTerm: string, fields: string[]): boolean {
  if (!searchTerm) return true;

  const lowerSearch = searchTerm.toLowerCase();

  return fields.some((field) => {
    const value = getNestedValue(item, field);
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(lowerSearch);
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

export function saveFilterPreferences(key: string, preferences: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`filter_prefs_${key}`, JSON.stringify(preferences));
  }
}

export function loadFilterPreferences(key: string): any {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`filter_prefs_${key}`);
    return saved ? JSON.parse(saved) : null;
  }
  return null;
}