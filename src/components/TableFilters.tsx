import React from "react";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export type SortOrder = "latest" | "oldest";
export type DateFilter = "all" | "today" | "thisWeekend" | "next7" | "week" | "next30" | "month" | "custom";
export type StatusFilter = "all" | "upcoming" | "past" | "ongoing" | "cancelled";

interface TableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  
  dateFilter: DateFilter;
  onDateFilterChange: (value: DateFilter) => void;
  
  customDateRange?: { from?: Date; to?: Date };
  onCustomDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (value: StatusFilter) => void;
  
  showStatusFilter?: boolean;
  statusLabel?: string;
}

export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortOrder,
  onSortOrderChange,
  dateFilter,
  onDateFilterChange,
  customDateRange,
  onCustomDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = false,
  statusLabel = "Status",
}: TableFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Sort Order */}
        <Select value={sortOrder} onValueChange={(value: SortOrder) => onSortOrderChange(value)}>
          <SelectTrigger className="w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest → Oldest</SelectItem>
            <SelectItem value="oldest">Oldest → Latest</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={(value: DateFilter) => onDateFilterChange(value)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="thisWeekend">This Weekend</SelectItem>
            <SelectItem value="next7">Next 7 Days</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="next30">Next 30 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom Date Range Picker */}
        {dateFilter === "custom" && onCustomDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {customDateRange?.from ? (
                  customDateRange.to ? (
                    <>
                      {format(customDateRange.from, "MMM dd, yyyy")} -{" "}
                      {format(customDateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(customDateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{
                  from: customDateRange?.from,
                  to: customDateRange?.to,
                }}
                onSelect={(range) =>
                  onCustomDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Status Filter (Optional) */}
        {showStatusFilter && onStatusFilterChange && (
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => onStatusFilterChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={statusLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {statusLabel}</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}