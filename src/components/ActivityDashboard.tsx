
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Coffee, CheckCircle2, MapPin } from "lucide-react";
import { timeTrackingService, TimeEntryWithDuration } from "@/services/timeTrackingService";
import { taskLogService, TaskLogWithDetails } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";
import { format, differenceInMinutes } from "date-fns";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface ActivityDashboardProps {
  employees: Employee[];
  refreshTrigger?: number;
}

interface EmployeeActivity {
  employee: Employee;
  activeEntry?: TimeEntryWithDuration;
  activeBreak?: TimeEntryWithDuration;
  activeTask?: TaskLogWithDetails;
  todayHours: number;
  breakHours: number;
}

export function ActivityDashboard({ employees, refreshTrigger }: ActivityDashboardProps) {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [employees, refreshTrigger]);

  const loadActivities = async () => {
    try {
      const activityPromises = employees.map(async (employee) => {
        const [activeEntry, activeBreak, activeTask, todayEntries] = await Promise.all([
          timeTrackingService.getActiveTimeEntry(employee.id),
          timeTrackingService.getActiveBreak(employee.id),
          taskLogService.getActiveTask(employee.id),
          timeTrackingService.getTodayEntries(employee.id)
        ]);

        const stats = timeTrackingService.calculateTotalHours(todayEntries);

        return {
          employee,
          activeEntry: activeEntry || undefined,
          activeBreak: activeBreak || undefined,
          activeTask: activeTask || undefined,
          todayHours: stats.workHours,
          breakHours: stats.breakHours
        };
      });

      const results = await Promise.all(activityPromises);
      const activeOnly = results.filter(a => a.activeEntry);
      setActivities(activeOnly);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentDuration = (clockIn: string) => {
    return differenceInMinutes(new Date(), new Date(clockIn));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 dark:text-stone-400">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No active employees</p>
        <p className="text-sm">Employees will appear here when they clock in</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => {
        const currentWorkMinutes = activity.activeEntry?.clock_in 
          ? getCurrentDuration(activity.activeEntry.clock_in)
          : 0;

        return (
          <Card key={activity.employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={activity.employee.photo_url || undefined} />
                    <AvatarFallback>{getInitials(activity.employee.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{activity.employee.full_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Working
                      </Badge>
                      {activity.activeBreak && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Coffee className="h-3 w-3 mr-1" />
                          Break
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Current Session</span>
                  <span className="font-bold text-lg">{formatDuration(currentWorkMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Today Total</span>
                  <span className="font-medium">{activity.todayHours.toFixed(2)}h</span>
                </div>
                {activity.activeEntry?.clock_in && (
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    Started: {format(new Date(activity.activeEntry.clock_in), "h:mm a")}
                  </div>
                )}
              </div>

              {activity.activeTask && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Current Task
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    {activity.activeTask.building && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.activeTask.building.name}
                      </div>
                    )}
                    {activity.activeTask.task_type && (
                      <div className="font-medium">{activity.activeTask.task_type.name}</div>
                    )}
                  </div>
                </div>
              )}

              {!activity.activeTask && !activity.activeBreak && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">No active task</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
