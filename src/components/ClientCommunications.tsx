import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Mail, Send, Calendar, Upload, FileText, Clock, CheckCircle, XCircle, AlertCircle, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { clientCommunicationService, EMAIL_TEMPLATES } from "@/services/clientCommunicationService";
import type { EmailTemplate, ClientEmail, EmailTemplateType } from "@/types/communication";
import type { Booking } from "@/types/booking";
import { format } from "date-fns";

interface ClientCommunicationsProps {
  bookings: Booking[];
  onRefresh?: () => void;
}

export function ClientCommunications({ bookings, onRefresh }: ClientCommunicationsProps) {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [emailHistory, setEmailHistory] = useState<ClientEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCustomEmail, setIsCustomEmail] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [runningScheduled, setRunningScheduled] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    loadEmailHistory();
  }, []);

  const loadEmailHistory = async () => {
    try {
      const history = await clientCommunicationService.getAllClientEmails();
      setEmailHistory(history);
    } catch (error) {
      console.error("Failed to load email history:", error);
    }
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      if (selectedTemplate) {
        applyTemplate(selectedTemplate, booking);
      }
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "custom") {
      setIsCustomEmail(true);
      setSelectedTemplate(null);
      setEmailSubject("");
      setEmailBody("");
      setScheduledDate("");
      return;
    }

    setIsCustomEmail(false);
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      if (selectedBooking) {
        applyTemplate(template, selectedBooking);
      }
    }
  };

  const applyTemplate = (template: EmailTemplate, booking: Booking) => {
    const variables = {
      client_name: booking.name,
      event_date: format(new Date(booking.start_date), "MMM dd, yyyy"),
      file_name: attachmentName || "rental_agreement.pdf",
    };

    const processedBody = clientCommunicationService.processTemplate(template.body, variables);
    const processedSubject = clientCommunicationService.processTemplate(template.subject, variables);

    setEmailBody(processedBody);
    setEmailSubject(processedSubject);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rental-agreement template still requires a PDF; everything else (custom emails) can attach any common type.
    const isAgreementTemplate = selectedTemplate?.requiresAttachment;
    if (isAgreementTemplate && file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "The Rental Agreement template requires a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // 10 MB cap for custom email attachments — Gmail's hard limit is 25 MB but messages exceeding ~10 MB often get rejected.
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Attachments must be under 10 MB.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBooking) {
      toast({
        title: "Select Client First",
        description: "Please choose a booking before uploading a file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const eventDate = format(new Date(selectedBooking.start_date), "yyyy-MM-dd");
      const { url, name } = isAgreementTemplate
        ? await clientCommunicationService.uploadAgreement(file, selectedBooking.name, eventDate)
        : await clientCommunicationService.uploadAttachment(file, selectedBooking.name, eventDate);

      setAttachmentFile(file);
      setAttachmentUrl(url);
      setAttachmentName(name);

      if (selectedTemplate) {
        applyTemplate(selectedTemplate, selectedBooking);
      }

      toast({
        title: "File Uploaded",
        description: `Attached: ${name}`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunScheduledNow = async () => {
    setRunningScheduled(true);
    try {
      const res = await fetch("/api/run-scheduled-emails", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to run scheduled emails");
      toast({
        title: "Scheduled Run Complete",
        description: `Sent ${data.sent ?? 0}, failed ${data.failed ?? 0}, skipped ${data.skipped ?? 0}.`,
      });
      loadEmailHistory();
    } catch (error) {
      toast({
        title: "Run Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setRunningScheduled(false);
    }
  };

  const handleSendEmail = async (scheduled: boolean = false) => {
    if (!selectedBooking || !emailSubject || !emailBody) {
      toast({
        title: "Missing Information",
        description: "Please select a booking and fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTemplate?.requiresAttachment && !attachmentUrl) {
      toast({
        title: "Attachment Required",
        description: "This email template requires an attachment.",
        variant: "destructive",
      });
      return;
    }

    if (scheduled && !scheduledDate) {
      toast({
        title: "Date Required",
        description: "Please select a date to schedule the email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await clientCommunicationService.sendEmail({
        booking_id: selectedBooking.id,
        client_name: selectedBooking.name,
        client_email: selectedBooking.contact_email || "",
        email_type: (selectedTemplate?.type || "custom") as EmailTemplateType,
        subject: emailSubject,
        body: emailBody,
        attachment_url: attachmentUrl || undefined,
        attachment_name: attachmentName || undefined,
        scheduled_date: scheduled ? scheduledDate : undefined,
      });

      // ✅ Email sent successfully (even if logging failed)
      const successMessage = scheduled
        ? `Email scheduled for ${format(new Date(scheduledDate), "MMM dd, yyyy")}`
        : `Email sent successfully to ${selectedBooking.contact_email || "client"}`;
      
      const warningNote = result === null ? " (History logging unavailable)" : "";

      toast({
        title: scheduled ? "Email Scheduled" : "Email Sent",
        description: successMessage + warningNote,
      });

      resetForm();
      loadEmailHistory();
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBooking(null);
    setSelectedTemplate(null);
    setEmailSubject("");
    setEmailBody("");
    setScheduledDate("");
    setAttachmentFile(null);
    setAttachmentUrl("");
    setAttachmentName("");
    setIsCustomEmail(false);
    setShowScheduler(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      sent: "default",
      scheduled: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Client Communications
              </CardTitle>
              <CardDescription>Send preset or custom emails to clients with tracking</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Hide" : "View"} Email History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Booking Selection — searchable */}
          <div className="space-y-2">
            <Label>Select Client</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedBooking
                    ? `${selectedBooking.name} — ${format(new Date(selectedBooking.start_date), "MMM dd, yyyy")}${
                        selectedBooking.contact_email ? ` (${selectedBooking.contact_email})` : ""
                      }`
                    : "Choose a booking..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command
                  filter={(value, search) =>
                    value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                  }
                >
                  <CommandInput placeholder="Search by name, email, or date..." />
                  <CommandList>
                    <CommandEmpty>No bookings match.</CommandEmpty>
                    <CommandGroup>
                      {bookings.map((booking) => {
                        const dateLabel = booking.start_date
                          ? format(new Date(booking.start_date), "MMM dd, yyyy")
                          : "—";
                        const haystack = [
                          booking.name,
                          booking.contact_name,
                          booking.contact_email,
                          dateLabel,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <CommandItem
                            key={booking.id}
                            value={haystack}
                            onSelect={() => {
                              handleBookingSelect(booking.id);
                              setPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBooking?.id === booking.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {booking.name} — {dateLabel}
                              </span>
                              {booking.contact_email && (
                                <span className="text-xs text-muted-foreground">
                                  {booking.contact_email}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={selectedTemplate?.id || (isCustomEmail ? "custom" : "")} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload — Agreement template (PDF only) OR custom email (any common file) */}
          {(selectedTemplate?.requiresAttachment || isCustomEmail) && (
            <div className="space-y-2">
              <Label>
                {selectedTemplate?.requiresAttachment
                  ? "Upload Agreement (PDF)"
                  : "Attachment (optional)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept={
                    selectedTemplate?.requiresAttachment
                      ? "application/pdf"
                      : "application/pdf,image/png,image/jpeg,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  }
                  onChange={handleFileUpload}
                  disabled={loading || !selectedBooking}
                  className="flex-1"
                />
                {attachmentName && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {attachmentName}
                  </Badge>
                )}
              </div>
              {!selectedTemplate?.requiresAttachment && (
                <p className="text-xs text-muted-foreground">
                  PDF, image, Word doc, or .txt — up to 10 MB.
                </p>
              )}
            </div>
          )}

          {/* Email Subject - Only for Custom Emails */}
          {isCustomEmail && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
          )}

          {/* Email Body - Only for Custom Emails */}
          {isCustomEmail && (
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email body..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Schedule date picker — hidden by default; revealed via "Schedule for later" toggle */}
          {showScheduler && (selectedTemplate?.allowScheduling || isCustomEmail) && (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <div className="flex items-center justify-between">
                <Label>Schedule for Later</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowScheduler(false);
                    setScheduledDate("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Scheduled emails fire when the &quot;Send pending scheduled&quot; runner is invoked
                (manually from Email History, or via a cron job).
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!showScheduler ? (
              <>
                <Button
                  onClick={() => handleSendEmail(false)}
                  disabled={loading || !selectedBooking}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Sending…" : "Send Now"}
                </Button>
                {(selectedTemplate?.allowScheduling || isCustomEmail) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScheduler(true)}
                    disabled={loading || !selectedBooking}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule for later
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => handleSendEmail(true)}
                disabled={loading || !selectedBooking || !scheduledDate}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                {loading ? "Scheduling…" : "Schedule Email"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Email History</DialogTitle>
                <DialogDescription>View all sent and scheduled client emails</DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunScheduledNow}
                disabled={runningScheduled}
              >
                {runningScheduled ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send pending scheduled
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {emailHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No emails sent yet</p>
            ) : (
              emailHistory.map((email) => (
                <Card key={email.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(email.status)}
                          <span className="font-semibold">{email.client_name}</span>
                          {getStatusBadge(email.status)}
                          <Badge variant="outline">{email.email_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{email.client_email}</p>
                        <p className="text-sm font-medium">{email.subject}</p>
                        {email.attachment_name && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            {email.attachment_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {email.status === "sent" && email.sent_date && (
                          <p>Sent: {format(new Date(email.sent_date), "MMM dd, yyyy HH:mm")}</p>
                        )}
                        {email.status === "scheduled" && email.scheduled_date && (
                          <p>Scheduled: {format(new Date(email.scheduled_date), "MMM dd, yyyy HH:mm")}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}