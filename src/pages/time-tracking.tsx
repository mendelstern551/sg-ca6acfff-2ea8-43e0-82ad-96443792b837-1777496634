import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Clock, BarChart3, Calendar } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { EmployeeList } from "@/components/EmployeeList";
import { TimeClock } from "@/components/TimeClock";
import { employeeService } from "@/services/employeeService";
import { timeTrackingService } from "@/services/timeTrackingService";
import { taskLogService } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { BuildingTaskSetup } from "@/components/BuildingTaskSetup";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];

export default function TimeTrackingPage() {
  const [activeTab, setActiveTab] = useState("clock");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, [refreshKey]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      toast({
        title: "Employee Deleted",
        description: "Employee and all associated records have been deleted"
      });
      await loadEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const handleEmployeeSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setEditingEmployee(undefined);
  };

  const activeEmployees = employees.filter(e => e.status === "active");
  const totalEmployees = employees.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-blue-50 dark:from-stone-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-stone-600 dark:text-stone-400">Loading time tracking system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-blue-50 dark:from-stone-950 dark:via-slate-900 dark:to-indigo-950">
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                ← Back to Dashboard
              </Link>
              <div className="border-l border-stone-300 dark:border-stone-700 h-6"></div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Employee Time Tracking</h1>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Clock in/out, task tracking & payroll management</p>
              </div>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Total Employees</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalEmployees}</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                <span className="text-green-600 dark:text-green-400 font-medium">{activeEmployees.length} Active</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Clocked In Today</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Currently working</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-700 dark:text-stone-300">Today's Hours</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0.0</div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Total work hours</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1">
            <TabsTrigger value="clock">Time Clock</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-4">
            <TimeClock 
              employees={activeEmployees} 
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-stone-900 dark:text-stone-100">Employee Management</CardTitle>
                    <CardDescription className="text-stone-600 dark:text-stone-400">
                      Add and manage your cleaning crew employees
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      setEditingEmployee(undefined);
                      setEmployeeDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <EmployeeList
                  employees={employees}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                />
              </CardContent>
            </Card>

            <BuildingTaskSetup />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Activity Dashboard
                </CardTitle>
                <CardDescription>Real-time employee activity and task tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No active time entries</p>
                  <p className="text-sm">Employees will appear here when they clock in</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Time Reports & Payroll
                </CardTitle>
                <CardDescription>Generate detailed time tracking reports for payroll</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Reports coming soon</p>
                  <p className="text-sm">Time reports and payroll exports will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={editingEmployee}
        onSuccess={handleEmployeeSuccess}
      />
    </div>
  );
}
