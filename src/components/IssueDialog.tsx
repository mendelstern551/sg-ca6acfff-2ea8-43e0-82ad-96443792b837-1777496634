import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { issueService } from "@/services/issueService";

interface IssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskLogId?: string | null;
  roomId?: string | null;
  buildingId?: string | null;
  employeeId?: string;
  onSuccess: () => void;
}

export function IssueDialog({
  open,
  onOpenChange,
  taskLogId,
  roomId,
  buildingId,
  employeeId,
  onSuccess,
}: IssueDialogProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setDescription("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the issue.",
        variant: "destructive",
      });
      return;
    }
    if (!employeeId) {
        toast({
            title: "Error",
            description: "Employee not identified.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      await issueService.createIssue({
        description,
        task_log_id: taskLogId,
        room_id: roomId,
        building_id: buildingId,
        reported_by_id: employeeId,
        status: 'new',
        title: description.substring(0, 50),
      });
      toast({
        title: "✅ Issue Reported",
        description: "Thank you! The issue has been sent to the administrator.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast({
        title: "Error",
        description: "Could not report the issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Found something wrong? Please describe the issue in detail.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., The sink in the main bathroom is leaking."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
