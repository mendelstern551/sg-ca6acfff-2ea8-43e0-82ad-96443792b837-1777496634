import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { issueService } from "@/services/issueService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";

type IssueWithDetails = Awaited<ReturnType<typeof issueService.getOpenIssues>>[0];

export function OpenIssuesNotifier() {
  const [issues, setIssues] = useState<IssueWithDetails[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const openIssues = await issueService.getOpenIssues();
      setIssues(openIssues);
    } catch (error) {
      console.error("Failed to fetch open issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();

    const channel = supabase
      .channel('issues-notifier')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'issues'
      },
      (payload) => {
        fetchIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isOpen || (issues.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="fixed top-24 left-4 z-[100] w-full max-w-sm">
      <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <CardTitle className="text-base font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            New Issues Reported
            <Badge variant="destructive" className="ml-2">{issues.length}</Badge>
          </CardTitle>
          <button onClick={() => setIsOpen(false)} className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-3 pt-0 max-h-80 overflow-y-auto">
          {loading ? (
             <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">Loading issues...</p>
          ) : (
            <ul className="space-y-2">
              {issues.map(issue => (
                <li key={issue.id} className="text-sm p-2 bg-white dark:bg-red-900/50 rounded-md border border-red-100 dark:border-red-800">
                  <p className="font-medium text-red-900 dark:text-red-100 truncate">{issue.description}</p>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1 flex justify-between">
                    <span>
                      {issue.rooms?.name || 'Building-wide'} by {issue.employees?.full_name || 'Unknown'}
                    </span>
                    <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
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