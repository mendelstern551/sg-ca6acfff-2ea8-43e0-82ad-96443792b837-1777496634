import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, Filter, Trash2, CheckCircle2, XCircle, Clock, FileText, Calendar, DollarSign, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { emailTrackingService } from "@/services/emailTrackingService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type EmailLog = Database["public"]["Tables"]["email_logs"]["Row"];

interface EmailHistoryProps {
  bookings?: Array<{ id: string; name: string; contact_name: string }>;
}

const emailTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  invoice: { label: "Invoice", icon: FileText, color: "bg-blue-500" },
  confirmation: { label: "Booking Confirmation", icon: Calendar, color: "bg-green-500" },
  payment_reminder: { label: "Payment Reminder", icon: DollarSign, color: "bg-orange-500" },
  feedback_request: { label: "Feedback Request", icon: MessageSquare, color: "bg-purple-500" },
  other: { label: "Other", icon: Mail, color: "bg-slate-500" }
};

const statusConfig = {
  sent: { label: "Sent", icon: CheckCircle2, variant: "default" as const, color: "text-green-600" },
  failed: { label: "Failed", icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-orange-600" }
};

export function EmailHistory({ bookings = [] }: EmailHistoryProps) {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [stats, setStats] = useState({ total: 0, byType: {}, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEmailLogs();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [emailLogs, searchTerm, filterType, filterStatus]);

  const loadEmailLogs = async () => {
    try {
      setLoading(true);
      const logs = await emailTrackingService.getAllEmailLogs();
      setEmailLogs(logs);
    } catch (error) {
      console.error("Error loading email logs:", error);
      toast({
        title: "Error",
        description: "Failed to load email history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await emailTrackingService.getEmailStats();
      setStats(statistics);
    } catch (error) {
      console.error("Error loading email stats:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...emailLogs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.recipient_email.toLowerCase().includes(term) ||
        log.recipient_name?.toLowerCase().includes(term) ||
        log.subject.toLowerCase().includes(term)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(log => log.email_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email log?")) return;

    try {
      await emailTrackingService.deleteEmailLog(id);
      toast({
        title: "Email Log Deleted",
        description: "The email log has been removed"
      });
      await loadEmailLogs();
      await loadStats();
    } catch (error) {
      console.error("Error deleting email log:", error);
      toast({
        title: "Error",
        description: "Failed to delete email log",
        variant: "destructive"
      });
    }
  };

  const getBookingName = (bookingId: string | null) => {
    if (!bookingId) return "General";
    const booking = bookings.find(b => b.id === bookingId);
    return booking ? `${booking.name} (${booking.contact_name})` : "Unknown Booking";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading email history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices Sent</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType['invoice'] || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Invoice emails</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmations</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType['confirmation'] || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Booking confirmations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType['payment_reminder'] || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Payment reminders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.byType['feedback_request'] || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Sent to clients</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Communication History
              </CardTitle>
              <CardDescription>
                Track all emails sent to clients for bookings, invoices, reminders, and feedback requests
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="confirmation">Confirmations</SelectItem>
                <SelectItem value="payment_reminder">Payment Reminders</SelectItem>
                <SelectItem value="feedback_request">Feedback Requests</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {emailLogs.length === 0 ? "No Email History" : "No Results Found"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {emailLogs.length === 0 
                  ? "Emails sent to clients will appear here. Start by sending an invoice or booking confirmation."
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const typeInfo = emailTypeLabels[log.email_type] || emailTypeLabels.other;
                const statusInfo = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.pending;
                const TypeIcon = typeInfo.icon;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className={`p-2 ${typeInfo.color} text-white rounded-lg`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.subject}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            To: {log.recipient_name || log.recipient_email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            {log.recipient_email}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.sent_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        {log.booking_id && (
                          <>
                            <span>•</span>
                            <span>{getBookingName(log.booking_id)}</span>
                          </>
                        )}
                      </div>

                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200">
                          <strong>Error:</strong> {log.error_message}
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                          <details>
                            <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                              Additional details
                            </summary>
                            <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}