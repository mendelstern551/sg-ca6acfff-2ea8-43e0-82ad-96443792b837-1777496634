import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { EnhancedCalendar } from "./ui/enhanced-calendar";
import { timeTrackingService, TimeEntryWithDuration } from "@/services/timeTrackingService";
import type { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface TimeReportsProps {
  employees: Employee[];
}

export function TimeReportDialog({ open, onOpenChange, employees }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Time Reports</DialogTitle>
          <DialogDescription>
            View and export time reports for all employees.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-1">
          <TimeReports employees={employees} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TimeReports({ employees }: TimeReportsProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDuration[]>([]);
  const [totals, setTotals] = useState({ workHours: 0, breakHours: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [selectedEmployee, dateRange]);

  const fetchReports = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);

    try {
      let allEntries: TimeEntryWithDuration[] = [];
      const employeeIds = selectedEmployee === "all"
        ? employees.map(e => e.id)
        : [selectedEmployee];

      for (const id of employeeIds) {
        const entries = await timeTrackingService.getDateRangeEntries(
          id,
          dateRange.from,
          dateRange.to
        );
        allEntries = [...allEntries, ...entries];
      }

      // Add employee name to each entry for display
      const entriesWithNames = allEntries.map(entry => {
        const employee = employees.find(e => e.id === entry.employee_id);
        return { ...entry, employee_name: employee?.full_name || "Unknown" };
      });

      setTimeEntries(entriesWithNames);
      const totalStats = timeTrackingService.calculateTotalHours(allEntries);
      setTotals(totalStats);
    } catch (error) {
      console.error("Failed to fetch time reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Employee", "Date", "Clock In", "Clock Out", "Type", "Duration (minutes)"];
    const csvData = timeEntries.map(entry => [
      entry.employee_name,
      format(new Date(entry.clock_in), "yyyy-MM-dd"),
      format(new Date(entry.clock_in), "HH:mm:ss"),
      entry.clock_out ? format(new Date(entry.clock_out), "HH:mm:ss") : "N/A",
      entry.entry_type,
      entry.duration_minutes || 0
    ].join(",")).join("\n");

    const csvContent = `${headers.join(",")}\n${csvData}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `time_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.full_name || "Unknown";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Reports</CardTitle>
        <CardDescription>View and export time tracking data for employees.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[280px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <EnhancedCalendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleExport} disabled={timeEntries.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            <span className="ml-2">Loading reports...</span>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedEmployee === "all" && <TableHead>Employee</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.length > 0 ? (
                  timeEntries.map(entry => (
                    <TableRow key={entry.id}>
                      {selectedEmployee === "all" && <TableCell>{entry.employee_name}</TableCell>}
                      <TableCell>{format(new Date(entry.clock_in), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${entry.entry_type === "work" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {entry.entry_type}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(entry.clock_in), "h:mm a")}</TableCell>
                      <TableCell>{entry.clock_out ? format(new Date(entry.clock_out), "h:mm a") : "Active"}</TableCell>
                      <TableCell className="text-right">
                        {entry.duration_minutes ? `${entry.duration_minutes.toFixed(0)} min` : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={selectedEmployee === "all" ? 6 : 5} className="h-24 text-center">
                      No entries found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={selectedEmployee === "all" ? 4 : 3}>Total</TableCell>
                  <TableCell className="text-right font-bold" colSpan={2}>
                    Work: {totals.workHours.toFixed(2)}h | Breaks: {totals.breakHours.toFixed(2)}h
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}