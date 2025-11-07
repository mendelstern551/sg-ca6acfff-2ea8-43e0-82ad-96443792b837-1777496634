import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, X, Play, Square, Coffee, LogIn, LogOut, CheckCircle, PlayCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'TASK_START' | 'TASK_COMPLETE';
  timestamp: string;
  employeeName: string;
  details?: string;
}

const MAX_ACTIVITIES = 10;

const ICON_MAP = {
    CLOCK_IN: <LogIn className="h-4 w-4 text-green-500" />,
    CLOCK_OUT: <LogOut className="h-4 w-4 text-red-500" />,
    BREAK_START: <Coffee className="h-4 w-4 text-yellow-500" />,
    BREAK_END: <Play className="h-4 w-4 text-gray-500" />,
    TASK_START: <PlayCircle className="h-4 w-4 text-blue-500" />,
    TASK_COMPLETE: <CheckCircle className="h-4 w-4 text-purple-500" />,
};

const TYPE_TEXT_MAP = {
    CLOCK_IN: "Clocked In",
    CLOCK_OUT: "Clocked Out",
    BREAK_START: "Started Break",
    BREAK_END: "Ended Break",
    TASK_START: "Started:",
    TASK_COMPLETE: "Completed:",
};


export function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleTimeEntry = async (payload: any) => {
        if (!payload.new.employee_id) return;
        const { data: employee } = await supabase.from('employees').select('full_name').eq('id', payload.new.employee_id).single();
        const employeeName = employee?.full_name || 'Unknown';
        
        let activity: ActivityItem | null = null;
        if (payload.eventType === 'INSERT' && payload.new.entry_type === 'work') {
            activity = { id: `time-${payload.new.id}`, type: 'CLOCK_IN', timestamp: payload.new.clock_in, employeeName };
        } else if (payload.eventType === 'UPDATE' && payload.new.entry_type === 'work' && payload.new.clock_out) {
            activity = { id: `time-${payload.new.id}`, type: 'CLOCK_OUT', timestamp: payload.new.clock_out, employeeName };
        } else if (payload.eventType === 'INSERT' && payload.new.entry_type === 'break') {
            activity = { id: `time-${payload.new.id}`, type: 'BREAK_START', timestamp: payload.new.clock_in, employeeName };
        } else if (payload.eventType === 'UPDATE' && payload.new.entry_type === 'break' && payload.new.clock_out) {
            activity = { id: `time-${payload.new.id}`, type: 'BREAK_END', timestamp: payload.new.clock_out, employeeName };
        }

        if (activity) {
            setActivities(prev => [activity!, ...prev].slice(0, MAX_ACTIVITIES));
        }
    };
    
    const handleTaskLog = async (payload: any) => {
        if (!payload.new.employee_id || !payload.new.task_type_id) return;
        const { data: employee } = await supabase.from('employees').select('full_name').eq('id', payload.new.employee_id).single();
        const { data: task } = await supabase.from('task_types').select('name').eq('id', payload.new.task_type_id).single();
        const employeeName = employee?.full_name || 'Unknown';
        const taskName = task?.name || 'a task';

        let activity: ActivityItem | null = null;
        if (payload.eventType === 'INSERT') {
             activity = { id: `task-${payload.new.id}`, type: 'TASK_START', timestamp: payload.new.started_at, employeeName, details: taskName };
        } else if (payload.eventType === 'UPDATE' && payload.new.completed_at) {
             activity = { id: `task-${payload.new.id}`, type: 'TASK_COMPLETE', timestamp: payload.new.completed_at, employeeName, details: taskName };
        }

        if(activity) {
            setActivities(prev => [activity!, ...prev].slice(0, MAX_ACTIVITIES));
        }
    };
    
    const timeEntriesChannel = supabase.channel('realtime-time-entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, handleTimeEntry)
      .subscribe();
      
    const taskLogsChannel = supabase.channel('realtime-task-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_logs' }, handleTaskLog)
      .subscribe();

    return () => {
      supabase.removeChannel(timeEntriesChannel);
      supabase.removeChannel(taskLogsChannel);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] w-full max-w-sm">
      <Card className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-stone-200 dark:border-stone-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <CardTitle className="text-base font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            What's Happening Now
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-3 pt-0 max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">Listening for employee activity...</p>
          ) : (
            <ul className="space-y-3">
              {activities.map(activity => (
                <li key={activity.id} className="text-sm flex items-start gap-3">
                    <div className="mt-1">{ICON_MAP[activity.type]}</div>
                    <div className="flex-1">
                        <p className="text-stone-800 dark:text-stone-200">
                            <span className="font-medium">{activity.employeeName}</span> {TYPE_TEXT_MAP[activity.type]} <span className="font-medium text-gray-800 dark:text-gray-300">{activity.details}</span>
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}