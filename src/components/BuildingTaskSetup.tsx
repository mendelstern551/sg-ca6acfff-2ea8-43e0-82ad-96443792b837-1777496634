import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { taskLogService } from "@/services/taskLogService";
import type { Database } from "@/integrations/supabase/types";

type TaskType = Database["public"]["Tables"]["task_types"]["Row"];

export function BuildingTaskSetup() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchTaskTypes = async () => {
    try {
      setLoading(true);
      const data = await taskLogService.getTaskTypes();
      // The service now returns a plain array, so we adapt.
      const formattedData = data.map(t => ({...t, building_id: null, created_at: new Date().toISOString(), description: null}));
      setTaskTypes(formattedData as TaskType[]);
    } catch (error) {
      console.error("Error fetching task types:", error);
      toast({
        title: "Error",
        description: "Could not load task types.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  const handleCreateTaskType = async () => {
    if (!newTypeName.trim()) {
      toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await taskLogService.createTaskType(newTypeName, "");
      toast({ title: "✅ Success", description: "New task type created." });
      setNewTypeName("");
      await fetchTaskTypes(); // Refresh the list
    } catch (error) {
      console.error("Error creating task type:", error);
      toast({ title: "Error", description: "Failed to create task type.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Global Task Types
            </CardTitle>
            <CardDescription>
              Manage the list of cleaning tasks available for all buildings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <h4 className="font-semibold text-sm">Create New Task</h4>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'Clean Windows'"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleCreateTaskType} disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Existing Tasks</h4>
          {loading ? (
            <p className="text-sm text-center text-slate-500 py-4">Loading tasks...</p>
          ) : taskTypes.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-4">No task types found.</p>
          ) : (
            <ul className="space-y-1">
              {taskTypes.map((task) => (
                <li key={task.id} className="text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                  {task.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}