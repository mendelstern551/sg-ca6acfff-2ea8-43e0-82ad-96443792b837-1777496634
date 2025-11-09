import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, Coffee, AlertTriangle, BedDouble, Bed, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { timeTrackingService } from "@/services/timeTrackingService";
import { taskLogService, TaskLog } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { BuildingWithRooms, Room, buildingService } from "@/services/buildingService";
import { IssueDialog } from "./IssueDialog";
import { TimeReportDialog } from "./TimeReports";
import { issueService } from "@/services/issueService";
import { RoomCleaningInterface } from "./RoomCleaningInterface";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

interface TimeClockProps {
  employees: Employee[];
  onRefresh: () => void;
}

// Self-contained component for each employee's time card
function EmployeeTimeCard({ employee, onRefresh, taskTypes, buildings }: {
  employee: Employee;
  onRefresh: () => void;
  taskTypes: { id: string; name: string }[];
  buildings: BuildingWithRooms[];
}) {
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [activeBreak, setActiveBreak] = useState<TimeEntry | null>(null);
  const [activeTask, setActiveTask] = useState<(TaskLog & { task_types: { name: string } | null, buildings: { name: string } | null, rooms: Room | null }) | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskNotes, setTaskNotes] = useState("");

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueReportingInfo, setIssueReportingInfo] = useState<{taskLogId: string | null, roomId: string | null} | null>(null);
  
  const [showRoomCleaning, setShowRoomCleaning] = useState(false);

  const { toast } = useToast();

  const fetchEmployeeStatus = async () => {
    if (!loading) setLoading(true);
    try {
      const [timeEntry, breakEntry, task] = await Promise.all([
        timeTrackingService.getActiveTimeEntry(employee.id),
        timeTrackingService.getActiveBreak(employee.id),
        taskLogService.getActiveTask(employee.id)
      ]);
      setActiveTimeEntry(timeEntry);
      setActiveBreak(breakEntry);
      setActiveTask(task);
    } catch (error) {
      console.error(`Failed to fetch status for ${employee.full_name}`, error);
      toast({ title: "Error", description: `Could not fetch status for ${employee.full_name}.`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStatus();
  }, [employee.id]);

  useEffect(() => {
    let workInterval: NodeJS.Timeout | undefined;
    if (activeTimeEntry?.clock_in) {
      const updateWorkTime = () => {
        setElapsedTime(differenceInMinutes(new Date(), new Date(activeTimeEntry.clock_in)));
      };
      updateWorkTime();
      workInterval = setInterval(updateWorkTime, 60000); // Update every minute
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (workInterval) clearInterval(workInterval);
    };
  }, [activeTimeEntry]);

  useEffect(() => {
    let breakInterval: NodeJS.Timeout | undefined;
    if (activeBreak?.clock_in) {
      const updateBreakTime = () => {
        setBreakTime(differenceInMinutes(new Date(), new Date(activeBreak.clock_in)));
      };
      updateBreakTime();
      breakInterval = setInterval(updateBreakTime, 60000);
    } else {
      setBreakTime(0);
    }
    return () => {
      if (breakInterval) clearInterval(breakInterval);
    };
  }, [activeBreak]);
  
  const formatTime = (minutes: number) => {
    if (minutes < 0) minutes = 0;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await timeTrackingService.clockIn(employee.id);
      toast({ title: "Clocked In", description: "Successfully clocked in." });
      await fetchEmployeeStatus();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to clock in.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      if (activeTask) await taskLogService.completeTask(activeTask.id);
      if (activeBreak) await timeTrackingService.endBreak(employee.id);
      await timeTrackingService.clockOut(employee.id);
      toast({ title: "Clocked Out", description: `Total work time: ${formatTime(elapsedTime)}` });
      await fetchEmployeeStatus();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to clock out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartBreak = async () => {
    setLoading(true);
    try {
        if (activeTask) await taskLogService.completeTask(activeTask.id);
        await timeTrackingService.startBreak(employee.id);
        toast({ title: "Break Started", description: "Enjoy your break." });
        await fetchEmployeeStatus();
        onRefresh();
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to start break.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
        await timeTrackingService.endBreak(employee.id);
        toast({ title: "Break Ended", description: `Break duration: ${formatTime(breakTime)}` });
        await fetchEmployeeStatus();
        onRefresh();
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to end break.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!activeTimeEntry || !selectedTaskId || !selectedBuildingId) {
      toast({ title: "Missing Information", description: "Please select a building and task.", variant: "destructive" });
      return;
    }
    setIsSubmittingTask(true);
    try {
      await taskLogService.startTask({
        employee_id: employee.id,
        task_type_id: selectedTaskId,
        building_id: selectedBuildingId,
        room_id: selectedRoomId,
        time_entry_id: activeTimeEntry.id,
        notes: taskNotes,
      });
      toast({ title: "Task Started!", description: "You can now begin your work." });
      setSelectedBuildingId(null);
      setSelectedRoomId(null);
      setSelectedTaskId(null);
      setTaskNotes("");
      await fetchEmployeeStatus();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start task.", variant: "destructive" });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleStopTask = async (taskLogId: string) => {
    setLoading(true);
    try {
      await taskLogService.completeTask(taskLogId);
      toast({ title: "Task Completed", description: "Great job!" });
      await fetchEmployeeStatus();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete task.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = (taskLog: TaskLog & { rooms?: Room | null }) => {
    setIssueReportingInfo({
      taskLogId: taskLog.id,
      roomId: taskLog.room_id
    });
    setIssueDialogOpen(true);
  };
  
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const selectedRoom = selectedBuilding?.rooms?.find(r => r.id === selectedRoomId);
  const mapUrl = selectedRoom?.map_image_url || selectedBuilding?.map_image_url;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{employee.full_name}</CardTitle>
        <CardDescription>
          Status: {activeTimeEntry ? "Clocked In" : "Clocked Out"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {loading && <div className="text-sm text-center text-slate-500">Loading status...</div>}
        
        {!loading && (
          <>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
              {activeTimeEntry && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Work Time</span>
                  <span className="text-lg font-bold">{formatTime(elapsedTime)}</span>
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
            </div>
            
            <div className="space-y-3">
              {!activeTimeEntry ? (
                <Button onClick={handleClockIn} disabled={loading} className="w-full" size="lg"><Play className="h-5 w-5 mr-2" />Clock In</Button>
              ) : (
                <>
                  {!activeBreak ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={handleStartBreak} disabled={loading || !!activeTask} variant="outline"><Coffee className="h-4 w-4 mr-2" />Start Break</Button>
                      <Button onClick={handleClockOut} disabled={loading} variant="destructive"><Square className="h-4 w-4 mr-2" />Clock Out</Button>
                    </div>
                  ) : (
                    <Button onClick={handleEndBreak} disabled={loading} className="w-full" variant="outline">End Break</Button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTimeEntry && !activeBreak && !activeTask && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant={!showRoomCleaning ? "default" : "outline"}
                onClick={() => setShowRoomCleaning(false)}
                className="flex-1"
              >
                Quick Tasks
              </Button>
              <Button
                variant={showRoomCleaning ? "default" : "outline"}
                onClick={() => setShowRoomCleaning(true)}
                className="flex-1"
              >
                Room Cleaning
              </Button>
            </div>

            {!showRoomCleaning ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Start a Task</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={selectedBuildingId || ""} onValueChange={id => { setSelectedBuildingId(id); setSelectedRoomId(null); }}>
                    <SelectTrigger><SelectValue placeholder="Select Building" /></SelectTrigger>
                    <SelectContent>
                      {buildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedRoomId || ""} onValueChange={setSelectedRoomId} disabled={!selectedBuildingId}>
                    <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                    <SelectContent>
                      {selectedBuilding?.rooms?.map(room => (
                        <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="md:col-span-2">
                    <Select value={selectedTaskId || ""} onValueChange={setSelectedTaskId}>
                      <SelectTrigger><SelectValue placeholder="Select Task Type" /></SelectTrigger>
                      <SelectContent>
                        {taskTypes.map(task => (
                          <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedBuilding && (
                  <Card className="mt-4 overflow-hidden">
                    <CardHeader className="p-3 bg-slate-100 dark:bg-slate-700">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{selectedRoom ? `Room: ${selectedRoom.name}` : `Building: ${selectedBuilding.name}`}</span>
                        {selectedRoom && (
                            <div className="flex items-center gap-3 text-xs font-normal">
                                <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {selectedRoom.bed_count || 0}</span>
                                <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {selectedRoom.bunk_bed_count || 0}</span>
                            </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      {mapUrl ? (
                          <img src={mapUrl} alt={`${selectedRoom?.name || selectedBuilding?.name} map`} className="rounded-md w-full object-contain max-h-60" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <p className="text-sm">No map available for this selection.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="mt-4">
                  <Textarea placeholder="Add optional notes for this task..." value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
                </div>
                <Button onClick={handleStartTask} disabled={isSubmittingTask || !selectedTaskId || !selectedBuildingId} className="w-full mt-4">
                  {isSubmittingTask ? "Starting..." : "Start Task"}
                </Button>
              </div>
            ) : (
              <RoomCleaningInterface
                employeeId={employee.id}
                employeeName={employee.full_name}
                onCleaningComplete={() => {
                  fetchEmployeeStatus();
                  onRefresh();
                }}
              />
            )}
          </div>
        )}

        {activeTimeEntry && activeTask && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300">Active Task</h4>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-200 mt-1">
                  {activeTask.task_types?.name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  at {activeTask.buildings?.name} {activeTask.rooms?.name && `- ${activeTask.rooms.name}`}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                  Started at {format(new Date(activeTask.started_at), "h:mm a")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button onClick={() => handleStopTask(activeTask.id)} size="sm" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportIssue(activeTask)}
                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </div>
            {activeTask.notes && (
              <div className="mt-3 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                <strong>Notes:</strong> {activeTask.notes}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <IssueDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        taskLogId={issueReportingInfo?.taskLogId}
        roomId={issueReportingInfo?.roomId}
        employeeId={employee.id}
        onSuccess={onRefresh}
      />
    </Card>
  );
}

export function TimeClock({ employees, onRefresh }: TimeClockProps) {
  const [taskTypes, setTaskTypes] = useState<{ id: string; name: string }[]>([]);
  const [buildings, setBuildings] = useState<BuildingWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tasksData, buildingsData] = await Promise.all([
        taskLogService.getTaskTypes(),
        buildingService.getBuildingsWithRooms()
      ]);
      setTaskTypes(tasksData);
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Error fetching initial time clock data:", error);
      toast({
        title: "Error",
        description: "Could not load required data for the time clock.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading Time Clock...</div>;
  }
  
  if (employees.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Time Clock</CardTitle>
                <CardDescription>No active employees to display.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-500 text-center py-4">Please add an active employee to use the time clock.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map(employee => (
        <EmployeeTimeCard 
          key={employee.id} 
          employee={employee} 
          onRefresh={onRefresh} 
          taskTypes={taskTypes}
          buildings={buildings}
        />
      ))}
    </div>
  );
}