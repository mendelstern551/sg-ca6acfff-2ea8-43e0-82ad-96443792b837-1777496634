
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building, ClipboardList, Trash2, Edit } from "lucide-react";
import { taskLogService } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Building = Database["public"]["Tables"]["buildings"]["Row"];
type TaskType = Database["public"]["Tables"]["task_types"]["Row"];

export function BuildingTaskSetup() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: "", address: "", description: "" });
  const [newTask, setNewTask] = useState({ buildingId: "", name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [buildingsData, taskTypesData] = await Promise.all([
        taskLogService.getAllBuildings(),
        loadAllTaskTypes()
      ]);
      setBuildings(buildingsData);
      setTaskTypes(taskTypesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadAllTaskTypes = async () => {
    const buildings = await taskLogService.getAllBuildings();
    const allTaskTypes: TaskType[] = [];
    for (const building of buildings) {
      const tasks = await taskLogService.getTaskTypesByBuilding(building.id);
      allTaskTypes.push(...tasks);
    }
    return allTaskTypes;
  };

  const handleCreateBuilding = async () => {
    if (!newBuilding.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Building name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await taskLogService.createBuilding(
        newBuilding.name,
        newBuilding.address || undefined,
        newBuilding.description || undefined
      );
      toast({
        title: "Building Created",
        description: `${newBuilding.name} has been added successfully`
      });
      setNewBuilding({ name: "", address: "", description: "" });
      setBuildingDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error creating building:", error);
      toast({
        title: "Error",
        description: "Failed to create building",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTaskType = async () => {
    if (!newTask.buildingId || !newTask.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Building and task name are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await taskLogService.createTaskType(
        newTask.buildingId,
        newTask.name,
        newTask.description || undefined
      );
      toast({
        title: "Task Type Created",
        description: `${newTask.name} has been added successfully`
      });
      setNewTask({ buildingId: "", name: "", description: "" });
      setTaskDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error creating task type:", error);
      toast({
        title: "Error",
        description: "Failed to create task type",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTasksByBuilding = (buildingId: string) => {
    return taskTypes.filter(t => t.building_id === buildingId);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Buildings
                </CardTitle>
                <CardDescription>Manage work locations</CardDescription>
              </div>
              <Button onClick={() => setBuildingDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Building
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {buildings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No buildings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {buildings.map((building) => (
                  <div
                    key={building.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                  >
                    <div className="font-medium">{building.name}</div>
                    {building.address && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {building.address}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-2">
                      {getTasksByBuilding(building.id).length} tasks configured
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Task Types
                </CardTitle>
                <CardDescription>Define task categories</CardDescription>
              </div>
              <Button
                onClick={() => setTaskDialogOpen(true)}
                size="sm"
                disabled={buildings.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {taskTypes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No task types yet</p>
                {buildings.length === 0 && (
                  <p className="text-xs mt-1">Add a building first</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {buildings.map((building) => {
                  const buildingTasks = getTasksByBuilding(building.id);
                  if (buildingTasks.length === 0) return null;
                  return (
                    <div key={building.id} className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {building.name}
                      </div>
                      {buildingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="ml-4 p-2 bg-slate-50 dark:bg-slate-800 rounded border text-sm"
                        >
                          {task.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
            <DialogDescription>Create a new work location for task tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="building-name">Building Name *</Label>
              <Input
                id="building-name"
                value={newBuilding.name}
                onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                placeholder="Main Lodge, Cabin 1, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building-address">Address</Label>
              <Input
                id="building-address"
                value={newBuilding.address}
                onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })}
                placeholder="123 Lake Road"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building-description">Description</Label>
              <Textarea
                id="building-description"
                value={newBuilding.description}
                onChange={(e) => setNewBuilding({ ...newBuilding, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuildingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBuilding} disabled={loading}>
              {loading ? "Creating..." : "Create Building"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task Type</DialogTitle>
            <DialogDescription>Define a new task category for employees to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-building">Building *</Label>
              <Select value={newTask.buildingId} onValueChange={(value) => setNewTask({ ...newTask, buildingId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building..." />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                id="task-name"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Linen Change, Cleaning, Garbage, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTaskType} disabled={loading}>
              {loading ? "Creating..." : "Create Task Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
