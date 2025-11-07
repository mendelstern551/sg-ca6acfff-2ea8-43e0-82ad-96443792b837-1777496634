import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, Coffee, MapPin, CheckCircle2 } from "lucide-react";
import { timeTrackingService } from "@/services/timeTrackingService";
import { taskLogService } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type Building = Database["public"]["Tables"]["buildings"]["Row"];
type TaskType = Database["public"]["Tables"]["task_types"]["Row"];
type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];

interface TimeClockProps {
  employees: Employee[];
  onRefresh?: () => void;
}

export function TimeClock({ employees, onRefresh }: TimeClockProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [activeBreak, setActiveBreak] = useState<TimeEntry | null>(null);
  const [activeTask, setActiveTask] = useState<TaskLog | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeStatus();
    } else {
      // Reset state when no employee is selected
      setActiveTimeEntry(null);
      setActiveBreak(null);
      setActiveTask(null);
      setElapsedTime(0);
      setBreakTime(0);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    // Only load task types if a valid building is selected
    if (selectedBuilding && selectedBuilding.trim() !== "") {
      loadTaskTypes(selectedBuilding);
    } else {
      // Clear task types when no building is selected
      setTaskTypes([]);
      setSelectedTaskType("");
    }
  }, [selectedBuilding]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimeEntry?.clock_in) {
      interval = setInterval(() => {
        const minutes = differenceInMinutes(new Date(), new Date(activeTimeEntry.clock_in));
        setElapsedTime(minutes);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeBreak?.clock_in) {
      interval = setInterval(() => {
        const minutes = differenceInMinutes(new Date(), new Date(activeBreak.clock_in));
        setBreakTime(minutes);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBreak]);

  const loadBuildings = async () => {
    try {
      const data = await taskLogService.getAllBuildings();
      setBuildings(data);
    } catch (error) {
      console.error("Error loading buildings:", error);
      toast({
        title: "Error Loading Buildings",
        description: "Failed to load building list. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const loadTaskTypes = async (buildingId: string) => {
    try {
      if (!buildingId || buildingId.trim() === "") {
        setTaskTypes([]);
        return;
      }
      
      const data = await taskLogService.getTaskTypesByBuilding(buildingId);
      setTaskTypes(data);
      
      if (data.length === 0) {
        toast({
          title: "No Tasks Configured",
          description: "This building has no task types set up yet.",
        });
      }
    } catch (error) {
      console.error("Error loading task types:", error);
      setTaskTypes([]);
      toast({
        title: "Error Loading Tasks",
        description: "Failed to load task types for this building.",
        variant: "destructive"
      });
    }
  };

  const loadEmployeeStatus = async () => {
    if (!selectedEmployeeId) return;

    const [timeEntry, breakEntry, task] = await Promise.all([
      timeTrackingService.getActiveTimeEntry(selectedEmployeeId),
      timeTrackingService.getActiveBreak(selectedEmployeeId),
      taskLogService.getActiveTask(selectedEmployeeId)
    ]);

    setActiveTimeEntry(timeEntry);
    setActiveBreak(breakEntry);
    setActiveTask(task);

    if (timeEntry?.clock_in) {
      const minutes = differenceInMinutes(new Date(), new Date(timeEntry.clock_in));
      setElapsedTime(minutes);
    }

    if (breakEntry?.clock_in) {
      const minutes = differenceInMinutes(new Date(), new Date(breakEntry.clock_in));
      setBreakTime(minutes);
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      await timeTrackingService.clockIn(selectedEmployeeId);
      toast({
        title: "Clocked In",
        description: "Successfully clocked in for work"
      });
      await loadEmployeeStatus();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      if (activeTask) {
        await taskLogService.completeTask(activeTask.id);
      }
      if (activeBreak) {
        await timeTrackingService.endBreak(selectedEmployeeId);
      }
      await timeTrackingService.clockOut(selectedEmployeeId);
      toast({
        title: "Clocked Out",
        description: `Total work time: ${formatTime(elapsedTime)}`
      });
      setActiveTimeEntry(null);
      setActiveBreak(null);
      setActiveTask(null);
      setElapsedTime(0);
      setBreakTime(0);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clock out",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      if (activeTask) {
        await taskLogService.completeTask(activeTask.id);
        setActiveTask(null);
      }
      await timeTrackingService.startBreak(selectedEmployeeId);
      toast({
        title: "Break Started",
        description: "Enjoy your break!"
      });
      await loadEmployeeStatus();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start break",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      await timeTrackingService.endBreak(selectedEmployeeId);
      toast({
        title: "Break Ended",
        description: `Break duration: ${formatTime(breakTime)}`
      });
      setBreakTime(0);
      await loadEmployeeStatus();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end break",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!selectedEmployeeId || !selectedBuilding || !selectedTaskType) {
      toast({
        title: "Missing Information",
        description: "Please select a building and task type",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await taskLogService.startTask(
        selectedEmployeeId,
        selectedBuilding,
        selectedTaskType,
        activeTimeEntry?.id
      );
      toast({
        title: "Task Started",
        description: "Task is now being tracked"
      });
      await loadEmployeeStatus();
      setSelectedBuilding("");
      setSelectedTaskType("");
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!activeTask) return;

    setLoading(true);
    try {
      await taskLogService.completeTask(activeTask.id);
      toast({
        title: "Task Completed",
        description: "Task has been marked as complete"
      });
      setActiveTask(null);
      await loadEmployeeStatus();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Clock
        </CardTitle>
        <CardDescription>Clock in/out and track tasks throughout the day</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Employee</label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees.filter(e => e.status === "active").map(employee => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployee && (
          <>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={activeTimeEntry ? "default" : "secondary"}>
                  {activeTimeEntry ? "Clocked In" : "Not Working"}
                </Badge>
              </div>

              {activeTimeEntry && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Work Time</span>
                    <span className="text-lg font-bold">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Started: {format(new Date(activeTimeEntry.clock_in), "h:mm a")}
                  </div>
                </div>
              )}

              {activeBreak && (
                <div className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">On Break</span>
                  </div>
                  <span className="text-sm font-bold">{formatTime(breakTime)}</span>
                </div>
              )}

              {activeTask && (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Active Task
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCompleteTask}
                      disabled={loading}
                      className="h-7"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!activeTimeEntry ? (
                <Button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Clock In
                </Button>
              ) : (
                <>
                  {!activeBreak ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleStartBreak}
                        disabled={loading}
                        variant="outline"
                      >
                        <Coffee className="h-4 w-4 mr-2" />
                        Start Break
                      </Button>
                      <Button
                        onClick={handleClockOut}
                        disabled={loading}
                        variant="destructive"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Clock Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      End Break
                    </Button>
                  )}

                  {!activeBreak && !activeTask && (
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium text-sm">Start New Task</h4>
                      <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building..." />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map(building => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedBuilding && (
                        <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select task..." />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTypes.map(task => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        onClick={handleStartTask}
                        disabled={loading || !selectedBuilding || !selectedTaskType}
                        className="w-full"
                      >
                        Start Task
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
