import { useState, useEffect } from "react";
import { Bell, X, Clock, Check, AlertCircle, Calendar, Mail, Wrench, UserCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isPast, isToday } from "date-fns";
import { reminderService } from "@/services/reminderService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

interface TaskSidebarProps {
  onCreateReminder: () => void;
  refreshTrigger?: number;
}

const categoryIcons = {
  booking: Calendar,
  maintenance: Wrench,
  follow_up: UserCheck,
  email: Mail,
  custom: AlertCircle
};

const categoryColors = {
  booking: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  follow_up: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  email: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
};

const priorityColors = {
  high: "border-l-4 border-red-500",
  medium: "border-l-4 border-yellow-500",
  low: "border-l-4 border-blue-500"
};

export function TaskSidebar({ onCreateReminder, refreshTrigger = 0 }: TaskSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadReminders();
  }, [refreshTrigger]);

  useEffect(() => {
    // Check for urgent tasks every minute
    const interval = setInterval(checkUrgentTasks, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const [today, overdue] = await Promise.all([
        reminderService.getTodayReminders(),
        reminderService.getOverdueReminders()
      ]);

      const allReminders = [...overdue, ...today];
      setReminders(allReminders);
      setUrgentCount(allReminders.filter(r => r.priority === "high" || isPast(new Date(r.due_date))).length);
    } catch (error) {
      console.error("Error loading reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUrgentTasks = () => {
    const urgent = reminders.filter(r => 
      r.priority === "high" || isPast(new Date(r.due_date))
    ).length;
    setUrgentCount(urgent);
  };

  const handleSnooze = async (reminderId: string, minutes: number) => {
    try {
      await reminderService.snoozeReminder(reminderId, minutes);
      toast({
        title: "Task Snoozed",
        description: `Reminder snoozed for ${minutes} minutes`
      });
      await loadReminders();
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive"
      });
    }
  };

  const handleDismiss = async (reminderId: string) => {
    try {
      await reminderService.dismissReminder(reminderId);
      toast({
        title: "Task Dismissed",
        description: "Reminder has been dismissed"
      });
      await loadReminders();
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss reminder",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      await reminderService.completeReminder(reminderId);
      toast({
        title: "Task Completed",
        description: "Great job! Task marked as complete",
        variant: "default"
      });
      await loadReminders();
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to complete reminder",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Floating Bell Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl bg-orange-600 hover:bg-orange-700 text-white relative"
        >
          <Bell className="h-6 w-6" />
          {urgentCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
              {urgentCount}
            </span>
          )}
        </Button>
      </div>

      {/* Task Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-stone-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <h2 className="text-2xl font-bold">Daily Tasks</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-orange-100">
              {reminders.length === 0
                ? "No tasks for today! 🎉"
                : `${reminders.length} task${reminders.length === 1 ? "" : "s"} to complete`}
            </p>
          </div>

          {/* Add New Task Button */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800">
            <Button
              onClick={onCreateReminder}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Reminder
            </Button>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-stone-600 dark:text-stone-400">Loading tasks...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-stone-300 dark:text-stone-700" />
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                  All Clear!
                </h3>
                <p className="text-stone-600 dark:text-stone-400">
                  No tasks due today. Create custom reminders to stay organized.
                </p>
              </div>
            ) : (
              reminders.map((reminder) => {
                const CategoryIcon = categoryIcons[reminder.category as keyof typeof categoryIcons];
                const categoryColor = categoryColors[reminder.category as keyof typeof categoryColors];
                const priorityColor = priorityColors[reminder.priority as keyof typeof priorityColors];
                const isOverdue = isPast(new Date(reminder.due_date)) && !isToday(new Date(reminder.due_date));

                return (
                  <Card
                    key={reminder.id}
                    className={`${priorityColor} hover:shadow-lg transition-shadow ${
                      isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${categoryColor}`}>
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold mb-1">
                              {reminder.title}
                            </CardTitle>
                            {reminder.description && (
                              <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                                {reminder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(reminder.due_date), "h:mm a")}
                              </Badge>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue!
                                </Badge>
                              )}
                              {reminder.priority === "high" && (
                                <Badge variant="destructive" className="text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        {/* Complete Button */}
                        <Button
                          onClick={() => handleComplete(reminder.id)}
                          size="sm"
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>

                        {/* Snooze Dropdown */}
                        <Select onValueChange={(value) => handleSnooze(reminder.id, parseInt(value))}>
                          <SelectTrigger className="w-[110px] h-9">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-xs">Snooze</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                            <SelectItem value="1440">1 day</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Dismiss Button */}
                        <Button
                          onClick={() => handleDismiss(reminder.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
