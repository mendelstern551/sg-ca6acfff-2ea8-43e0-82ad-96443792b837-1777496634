
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Calendar, DollarSign } from "lucide-react";
import { timeTrackingService, TimeEntryWithDuration } from "@/services/timeTrackingService";
import type { Database } from "@/integrations/supabase/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface TimeReportsProps {
  employees: Employee[];
}

interface EmployeeReport {
  employee: Employee;
  entries: TimeEntryWithDuration[];
  totalHours: number;
  totalPay: number;
}

export function TimeReports({ employees }: TimeReportsProps) {
  const [reportType, setReportType] = useState<"week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date();
    if (reportType === "week") {
      setStartDate(format(startOfWeek(today), "yyyy-MM-dd"));
      setEndDate(format(endOfWeek(today), "yyyy-MM-dd"));
    } else if (reportType === "month") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
    }
  }, [reportType]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select start and end dates",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const employeesToReport = selectedEmployeeId === "all" 
        ? employees 
        : employees.filter(e => e.id === selectedEmployeeId);

      const reportPromises = employeesToReport.map(async (employee) => {
        const entries = await timeTrackingService.getDateRangeEntries(
          employee.id,
          new Date(startDate),
          new Date(endDate)
        );

        const workEntries = entries.filter(e => e.entry_type === "work");
        const stats = timeTrackingService.calculateTotalHours(workEntries);
        const totalPay = stats.workHours * (Number(employee.hourly_rate) || 0);

        return {
          employee,
          entries: workEntries,
          totalHours: stats.workHours,
          totalPay
        };
      });

      const results = await Promise.all(reportPromises);
      setReports(results.filter(r => r.entries.length > 0));

      if (results.every(r => r.entries.length === 0)) {
        toast({
          title: "No Data",
          description: "No time entries found for the selected period",
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;

    const headers = ["Employee", "Date", "Clock In", "Clock Out", "Hours", "Hourly Rate", "Total Pay"];
    const rows = reports.flatMap(report =>
      report.entries.map(entry => [
        report.employee.full_name,
        format(new Date(entry.clock_in), "yyyy-MM-dd"),
        format(new Date(entry.clock_in), "HH:mm"),
        entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "N/A",
        ((entry.duration_minutes || 0) / 60).toFixed(2),
        Number(report.employee.hourly_rate || 0).toFixed(2),
        (((entry.duration_minutes || 0) / 60) * Number(report.employee.hourly_rate || 0)).toFixed(2)
      ])
    );

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Time report has been downloaded as CSV"
    });
  };

  const totalHours = reports.reduce((sum, r) => sum + r.totalHours, 0);
  const totalPay = reports.reduce((sum, r) => sum + r.totalPay, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Time Report</CardTitle>
          <CardDescription>Select date range and employee to generate detailed time reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v: "week" | "month" | "custom") => setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={generateReport} disabled={loading} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Report"}
              </Button>
              {reports.length > 0 && (
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalPay.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Total Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.employee.id}>
                      <TableCell className="font-medium">{report.employee.full_name}</TableCell>
                      <TableCell>{report.totalHours.toFixed(2)}h</TableCell>
                      <TableCell>${Number(report.employee.hourly_rate || 0).toFixed(2)}/hr</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${report.totalPay.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
