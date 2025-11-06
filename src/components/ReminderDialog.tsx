import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { reminderService, CreateReminderData } from "@/services/reminderService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  bookings?: Array<{ id: string; name: string; contact_name: string }>;
}

export function ReminderDialog({ open, onOpenChange, onSuccess, bookings = [] }: ReminderDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"custom" | "maintenance" | "follow_up" | "booking" | "email">("custom");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [bookingId, setBookingId] = useState<string>("");
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("custom");
    setPriority("medium");
    setSelectedDate(new Date());
    setSelectedTime("09:00");
    setBookingId("");
    setRecurring(false);
    setRecurringInterval("daily");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reminder title",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const dueDate = new Date(selectedDate);
      dueDate.setHours(hours, minutes, 0, 0);

      const reminderData: CreateReminderData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate,
        bookingId: bookingId && bookingId !== "none" ? bookingId : undefined,
        recurring,
        recurringInterval: recurring ? recurringInterval : undefined
      };

      await reminderService.createReminder(reminderData);

      toast({
        title: "Reminder Created",
        description: `Reminder set for ${format(dueDate, "MMM d, yyyy 'at' h:mm a")}`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Reminder</DialogTitle>
          <DialogDescription>
            Set up a personal task reminder for maintenance, follow-ups, or custom tasks
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Reminder Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Call plumber for kitchen repair"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add more details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Task</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="booking">Booking Related</SelectItem>
                    <SelectItem value="email">Email Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Link to Booking (optional) */}
            {bookings.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="booking">Link to Booking (optional)</Label>
                <Select value={bookingId} onValueChange={setBookingId}>
                  <SelectTrigger id="booking">
                    <SelectValue placeholder="Select a booking (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No booking</SelectItem>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.name} - {booking.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reminder Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Reminder Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring" className="cursor-pointer">
                  Recurring Task
                </Label>
                <input
                  id="recurring"
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
              </div>

              {recurring && (
                <div className="space-y-2">
                  <Label htmlFor="interval">Repeat Interval</Label>
                  <Select value={recurringInterval} onValueChange={(value: any) => setRecurringInterval(value)}>
                    <SelectTrigger id="interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    This task will repeat automatically based on the interval
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? "Creating..." : "Create Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
