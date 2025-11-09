import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roomCleaningService, RoomWithBuilding, TaskWithCompletion, CleaningSessionWithDetails } from "@/services/roomCleaningService";
import { issueService } from "@/services/issueService";
import { Home, CheckCircle2, AlertCircle, Clock, Thermometer, Bed, BedDouble, PlayCircle, StopCircle, LogOut, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoomCleaningInterfaceProps {
  employeeId: string;
  employeeName: string;
}

export function RoomCleaningInterface({ employeeId, employeeName }: RoomCleaningInterfaceProps) {
  const [rooms, setRooms] = useState<RoomWithBuilding[]>([]);
  const [activeSession, setActiveSession] = useState<CleaningSessionWithDetails | null>(null);
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [currentTaskForIssue, setCurrentTaskForIssue] = useState<TaskWithCompletion | null>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
    checkActiveSession();
  }, [employeeId]);

  useEffect(() => {
    if (activeSession) {
      loadTasks();
    }
  }, [activeSession]);

  const loadRooms = async () => {
    try {
      const data = await roomCleaningService.getRoomsWithBuildings();
      setRooms(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    }
  };

  const checkActiveSession = async () => {
    try {
      const session = await roomCleaningService.getActiveSession(employeeId);
      setActiveSession(session);
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const loadTasks = async () => {
    if (!activeSession) return;
    try {
      const tasksData = await roomCleaningService.getTasksWithCompletions(activeSession.id);
      setTasks(tasksData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    }
  };

  const startCleaning = async () => {
    if (!selectedRoom) {
      toast({
        title: "No Room Selected",
        description: "Please select a room to start cleaning",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const session = await roomCleaningService.startCleaningSession(employeeId, selectedRoom);
      setActiveSession(session);
      toast({
        title: "Clock In Successful",
        description: "Started cleaning session"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start cleaning session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (task: TaskWithCompletion, checked: boolean) => {
    if (!activeSession) return;

    try {
      if (checked) {
        await roomCleaningService.completeTask(activeSession.id, task.id);
      } else if (task.completion_id) {
        await roomCleaningService.uncompleteTask(task.completion_id);
      }
      await loadTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const openIssueDialog = (task: TaskWithCompletion) => {
    setCurrentTaskForIssue(task);
    setIssueDialogOpen(true);
  };

  const reportIssue = async () => {
    if (!activeSession || !currentTaskForIssue || !issueDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide issue details",
        variant: "destructive"
      });
      return;
    }

    try {
      const roomData = activeSession.room as any;
      const buildingData = roomData?.buildings || roomData?.building;
      
      await issueService.createIssue({
        room_id: activeSession.room_id,
        employee_id: employeeId,
        session_id: activeSession.id,
        task_name: currentTaskForIssue.task_name,
        description: issueDescription,
        status: "open",
        priority: "medium"
      });

      if (!currentTaskForIssue.completed) {
        await roomCleaningService.completeTask(
          activeSession.id,
          currentTaskForIssue.id,
          issueDescription,
          true
        );
      }

      await loadTasks();
      setIssueDialogOpen(false);
      setIssueDescription("");
      setCurrentTaskForIssue(null);

      toast({
        title: "Issue Reported",
        description: "Admin has been notified"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0) {
      toast({
        title: "Incomplete Tasks",
        description: `Please complete all ${incompleteTasks.length} remaining tasks before clocking out`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await roomCleaningService.endCleaningSession(activeSession.id);
      setActiveSession(null);
      setTasks([]);
      setSelectedRoom("");
      toast({
        title: "Clock Out Successful",
        description: "Cleaning session completed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (activeSession) {
    const roomData = activeSession.room as any;
    const buildingData = roomData?.buildings || roomData?.building;
    const roomName = roomData?.name || "Unknown Room";
    const buildingName = Array.isArray(buildingData) ? buildingData[0]?.name : buildingData?.name || "Unknown Building";
    const targetHeating = Array.isArray(buildingData) ? buildingData[0]?.target_heating_level : buildingData?.target_heating_level;
    
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Currently Cleaning
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="font-medium text-orange-900 dark:text-orange-100">{roomName}</span>
                  <span className="mx-2">•</span>
                  <span>{buildingName}</span>
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {progress}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-orange-800 dark:text-orange-200">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Started: {new Date(activeSession.clock_in_time).toLocaleTimeString()}
              </span>
              {targetHeating && (
                <span className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  Target: {targetHeating}°C
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Cleaning Checklist ({completedCount}/{totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-all ${
                    task.completed
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => handleTaskToggle(task, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label className={`font-medium cursor-pointer ${task.completed ? "line-through text-green-700 dark:text-green-300" : ""}`}>
                          {task.task_name}
                        </Label>
                        {task.issue_reported && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Issue Reported
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                        {task.task_description}
                      </p>
                      {task.notes && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{task.notes}</AlertDescription>
                        </Alert>
                      )}
                      {!task.completed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openIssueDialog(task)}
                          className="mt-2 text-xs"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Report Issue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={endSession}
              disabled={loading || completedCount < totalCount}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Clock Out & Complete Session
            </Button>
          </CardContent>
        </Card>

        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Report Issue
              </DialogTitle>
              <DialogDescription>
                {currentTaskForIssue?.task_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="issue-description">Issue Description</Label>
                <Textarea
                  id="issue-description"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIssueDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={reportIssue} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Submit Issue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!activeSession ? (
        <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-600" />
              Start Room Cleaning
            </CardTitle>
            <CardDescription>
              Select a room to begin cleaning and track your tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                Select Room
              </label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a room to clean..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-xs text-stone-500">
                          ({room.building_name} • Floor {room.floor ?? "N/A"})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={startCleaning}
              disabled={!selectedRoom || loading}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {loading ? "Starting..." : "Start Cleaning"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Home className="h-5 w-5 text-orange-600" />
                  {currentRoom?.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{currentRoom?.building_name}</Badge>
                  <Badge variant="outline">Floor {currentRoom?.floor ?? "N/A"}</Badge>
                  <span className="text-xs text-stone-500">
                    Started {activeSession.clock_in_time ? formatDistanceToNow(new Date(activeSession.clock_in_time), { addSuffix: true }) : ""}
                  </span>
                </CardDescription>
              </div>
              {currentRoom?.target_heating_level && (
                <Badge variant="secondary" className="gap-1">
                  <Thermometer className="h-3 w-3" />
                  {Number(currentRoom.target_heating_level).toFixed(0)}°C
                </Badge>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Progress: {completedCount} / {totalTasks} tasks
                </span>
                <span className="text-sm font-bold text-orange-600">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-6">
            <div className="grid gap-2 mb-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600 dark:text-stone-400">Single Beds:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {currentRoom?.bed_count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600 dark:text-stone-400">Bunk Beds:</span>
                <span className="font-semibold flex items-center gap-1">
                  <BedDouble className="h-4 w-4" />
                  {currentRoom?.bunk_bed_count || 0}
                </span>
              </div>
            </div>

            <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-orange-600" />
              Cleaning Tasks
            </h4>

            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    task.completed
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600"
                  }`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleCompleteTask(task)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                        {index + 1}.
                      </span>
                      <span className={`text-sm font-medium ${task.completed ? "line-through text-stone-500 dark:text-stone-400" : "text-stone-900 dark:text-stone-100"}`}>
                        {task.task_name}
                      </span>
                      {task.issue_reported && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Issue
                        </Badge>
                      )}
                    </div>
                    {task.notes && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 pl-6">
                        Note: {task.notes}
                      </p>
                    )}
                  </div>
                  {!task.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteTask(task, true)}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Report Issue
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 mt-6"
              onClick={handleFinishCleaning}
              disabled={completedCount < totalTasks}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Finish Room Cleaning
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Report Issue
            </DialogTitle>
            <DialogDescription>
              {currentTaskForIssue?.task_name} - Describe the problem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe the issue in detail (e.g., 'Toilet won't stop running', 'Light fixture broken')"
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleReportIssue}
              disabled={!issueNotes.trim()}
            >
              Report & Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}