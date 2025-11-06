"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X, Check, AlertCircle, Calendar, Mail, Wrench, UserCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

interface ReminderModalProps {
  reminder: Reminder;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
  onSnoozeMinimize: (minutes: number) => void;
  onDismiss: () => void;
}

const categoryIcons = {
  booking: Calendar,
  maintenance: Wrench,
  follow_up: UserCheck,
  email: Mail,
  custom: AlertCircle
};

const categoryColors = {
  booking: "bg-blue-500",
  maintenance: "bg-orange-500",
  follow_up: "bg-purple-500",
  email: "bg-green-500",
  custom: "bg-slate-500"
};

export function ReminderModal({
  reminder,
  onComplete,
  onSnooze,
  onSnoozeMinimize,
  onDismiss
}: ReminderModalProps) {
  const [snoozeTime, setSnoozeTime] = useState("15");
  const [mounted, setMounted] = useState(false);

  const CategoryIcon = categoryIcons[reminder.category as keyof typeof categoryIcons];
  const categoryColor = categoryColors[reminder.category as keyof typeof categoryColors];

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center pointer-events-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      onMouseDown={(e) => { e.stopPropagation(); }}
      onTouchStart={(e) => { e.stopPropagation(); }}
    >
      {/* Backdrop that blocks background clicks */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto z-[2147483645]"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      />
      {/* Center Modal */}
      <div
        className="relative z-[2147483646] p-4 w-full max-w-md pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full bg-white dark:bg-stone-900 shadow-2xl border-4 border-orange-500 animate-in zoom-in-95 rounded-lg overflow-hidden">
          {/* Header with Icon */}
          <div className={`${categoryColor} text-white p-6 relative`}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="bg-white dark:bg-stone-900 rounded-full p-4 shadow-2xl border-4 border-orange-500">
                <Bell className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <CategoryIcon className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">
                  {reminder.category.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{reminder.title}</h2>
              {reminder.description && (
                <p className="text-white/90 text-sm">{reminder.description}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Due Time and Priority */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-sm py-1">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(reminder.due_date), "MMM d, h:mm a")}
              </Badge>
              {reminder.priority === "high" && (
                <Badge variant="destructive" className="text-sm py-1">
                  High Priority
                </Badge>
              )}
            </div>

            {/* Snooze Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Snooze for:
              </label>
              <Select value={snoozeTime} onValueChange={setSnoozeTime}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="1440">Tomorrow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Complete Button - Primary */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Mark as Complete
              </Button>

              {/* Snooze Button - Secondary */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(parseInt(snoozeTime));
                }}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2"
              >
                <Clock className="h-5 w-5 mr-2" />
                Snooze (Reappear in Center)
              </Button>

              {/* Snooze & Minimize Button - Secondary */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSnoozeMinimize(parseInt(snoozeTime));
                }}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Bell className="h-5 w-5 mr-2" />
                Snooze & Move to Corner
              </Button>

              {/* Dismiss Button - Danger */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                variant="ghost"
                className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss (Don't remind again)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
}
