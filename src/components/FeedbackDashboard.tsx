import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Star,
  DollarSign,
  Mail,
  AlertCircle
} from "lucide-react";
import { feedbackService, type BookingFeedbackStatus, type FeedbackStats } from "@/services/feedbackService";
import { format } from "date-fns";
import type { Booking } from "@/types/booking";

interface FeedbackDashboardProps {
  bookings: Booking[];
  onSendFeedbackRequest: (booking: Booking) => void;
}

export function FeedbackDashboard({ bookings, onSendFeedbackRequest }: FeedbackDashboardProps) {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [bookingStatuses, setBookingStatuses] = useState<Map<string, BookingFeedbackStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    loadFeedbackData();
  }, [bookings]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      const [feedbackStats, statuses] = await Promise.all([
        feedbackService.getFeedbackStats(),
        feedbackService.getBookingsFeedbackStatus(bookings.map(b => b.id))
      ]);
      
      setStats(feedbackStats);
      setBookingStatuses(statuses);
    } catch (error) {
      console.error("Error loading feedback data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const status = bookingStatuses.get(booking.id);
      if (!status) return filterStatus === "all" || filterStatus === "pending";
      
      if (filterStatus === "pending") {
        return status.emailSent && !status.feedbackReceived;
      }
      if (filterStatus === "completed") {
        return status.feedbackReceived;
      }
      return true;
    }).sort((a, b) => {
      const statusA = bookingStatuses.get(a.id);
      const statusB = bookingStatuses.get(b.id);
      
      // Sort by: pending responses (with emails sent) first, then by email sent date
      if (statusA?.emailSent && !statusA.feedbackReceived && statusB?.emailSent && !statusB.feedbackReceived) {
        return (statusB.daysSinceEmailSent || 0) - (statusA.daysSinceEmailSent || 0);
      }
      if (statusA?.emailSent && !statusA.feedbackReceived) return -1;
      if (statusB?.emailSent && !statusB.feedbackReceived) return 1;
      
      return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    });
  };

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading feedback data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Sent</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total emails</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalResponded}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Feedback received</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.responseRate.toFixed(1)}%</div>
            <Progress value={stats.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-2 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingResponses}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-2 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Issued</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalBonusIssued.toFixed(0)}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">In credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List with Feedback Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Booking Feedback Status
              </CardTitle>
              <CardDescription>
                Track which bookings have received feedback requests and responses
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({bookings.length})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Pending ({stats.pendingResponses})
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("completed")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Completed ({stats.totalResponded})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Bookings Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {filterStatus === "pending" && "No pending feedback requests"}
                {filterStatus === "completed" && "No completed feedback yet"}
                {filterStatus === "all" && "No bookings available"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const status = bookingStatuses.get(booking.id);
                const isPastEvent = new Date(booking.end_date) < new Date();
                
                return (
                  <div
                    key={booking.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${
                      status?.feedbackReceived 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : status?.emailSent 
                          ? 'bg-orange-100 dark:bg-orange-900/30'
                          : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {status?.feedbackReceived ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : status?.emailSent ? (
                        <Clock className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Mail className="h-5 w-5 text-slate-500" />
                      )}
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {booking.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {booking.contact_name} • {format(new Date(booking.end_date), "MMM d, yyyy")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {status?.feedbackReceived ? (
                            <>
                              <Badge className="bg-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </Badge>
                              {status.rating && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-600" />
                                  {status.rating}/5
                                </Badge>
                              )}
                              {status.bonusIssued && (
                                <Badge className="bg-green-600">$50 Issued</Badge>
                              )}
                            </>
                          ) : status?.emailSent ? (
                            <>
                              <Badge className="bg-orange-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending Response
                              </Badge>
                              {status.daysSinceEmailSent && status.daysSinceEmailSent > 7 && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {status.daysSinceEmailSent} days ago
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary">Not Sent</Badge>
                          )}
                        </div>
                      </div>

                      {/* Status Details */}
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {status?.emailSent && status.emailSentDate && (
                          <span>
                            Email sent: {format(new Date(status.emailSentDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {status?.feedbackReceived && status.feedbackDate && (
                          <>
                            <span>•</span>
                            <span>
                              Responded: {format(new Date(status.feedbackDate), "MMM d, yyyy")}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex gap-2">
                        {!status?.emailSent && isPastEvent && (
                          <Button
                            size="sm"
                            onClick={() => onSendFeedbackRequest(booking)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Feedback Request
                          </Button>
                        )}
                        {status?.emailSent && !status.feedbackReceived && status.daysSinceEmailSent && status.daysSinceEmailSent > 7 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSendFeedbackRequest(booking)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Request
                          </Button>
                        )}
                        {status?.feedbackReceived && !status.bonusIssued && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Issue $50 Bonus
                          </Button>
                        )}
                      </div>
                    </div>
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