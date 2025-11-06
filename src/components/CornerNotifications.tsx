import { useState } from "react";
import { X, Check, Clock, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

interface CornerNotificationsProps {
  reminders: Reminder[];
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onExpand: (reminder: Reminder) => void;
}

export function CornerNotifications({
  reminders,
  onComplete,
  onDismiss,
  onExpand
}: CornerNotificationsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-6 z-[2147483600] pointer-events-auto space-y-2 max-w-sm">
      {/* Collapse/Expand Toggle */}
      {reminders.length > 1 && (
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          size="sm"
          variant="outline"
          className="w-full bg-white dark:bg-stone-900 shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show {reminders.length} Snoozed Tasks
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Minimize All
            </>
          )}
        </Button>
      )}

      {/* Notifications */}
      {!isCollapsed && reminders.map((reminder) => (
        <Card
          key={reminder.id}
          className="bg-white dark:bg-stone-900 shadow-2xl border-2 border-orange-400 p-4 animate-in slide-in-from-left-10"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg flex-shrink-0">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100 mb-1 line-clamp-2">
                {reminder.title}
              </h4>
              <Badge variant="outline" className="text-xs mb-2">
                {format(new Date(reminder.due_date), "h:mm a")}
              </Badge>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  onClick={() => onComplete(reminder.id)}
                  size="sm"
                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Done
                </Button>
                <Button
                  onClick={() => onExpand(reminder)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Snooze
                </Button>
                <Button
                  onClick={() => onDismiss(reminder.id)}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
