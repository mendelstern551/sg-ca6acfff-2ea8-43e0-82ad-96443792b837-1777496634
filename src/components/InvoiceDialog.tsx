import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";
import { invoiceService } from "@/services/invoiceService";
import { emailService } from "@/services/emailService";
import { format } from "date-fns";
import { Download, Loader2, FileText, Mail, Phone, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
}

export function InvoiceDialog({ open, onOpenChange, booking }: InvoiceDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [reminderHistory, setReminderHistory] = useState<any[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && booking) {
      loadOrCreateInvoice();
    }
  }, [open, booking]);

  const loadOrCreateInvoice = async () => {
    try {
      setLoading(true);
      let existingInvoice = await invoiceService.getInvoiceByBookingId(booking.id);

      if (!existingInvoice) {
        setGenerating(true);
        
        const validPayments = (booking.payments || []).filter(p => p && p.amount && p.amount > 0);
        const amountPaid = validPayments.length > 0 
          ? validPayments.reduce((sum, p) => sum + p.amount, 0) 
          : 0;
        const balanceDue = booking.total_cost - amountPaid;
        
        existingInvoice = await invoiceService.createInvoice(booking.id, {
          clientName: booking.contact_name,
          clientEmail: booking.contact_email || undefined,
          clientPhone: booking.contact_phone || undefined,
          eventDateStart: booking.start_date,
          eventDateEnd: booking.end_date,
          numberOfGuests: booking.number_of_guests,
          numberOfRooms: booking.number_of_rooms || 1,
          basePrice: booking.total_cost,
          depositAmount: amountPaid,
          balanceDue: balanceDue,
          totalAmount: booking.total_cost,
          notes: booking.notes || undefined
        });
      }

      setInvoice(existingInvoice);
      
      // Load reminder history
      const reminders = await invoiceService.getPaymentReminders(booking.id);
      setReminderHistory(reminders);
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice || !invoice.client_email) {
      toast({
        title: "No Email Address",
        description: "This invoice doesn't have a client email address. Please add one in the booking details.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSendingEmail(true);
      
      const emailPromise = emailService.sendInvoiceEmail(invoice, booking);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Email sending timed out after 30 seconds")), 30000)
      );
      
      const result = await Promise.race([emailPromise, timeoutPromise]) as any;
      
      if (result.success) {
        toast({
          title: "Email Sent Successfully! ✓",
          description: `Invoice sent to ${invoice.client_email}`,
        });
        // Reload to get updated email status
        await loadOrCreateInvoice();
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      
      let errorMessage = error.message || "Please check your email configuration and try again.";
      
      if (error.message?.includes("timed out")) {
        errorMessage = "Email sending took too long. The email may still send in the background. Please check your email in a few minutes.";
      }
      
      toast({
        title: "Failed to Send Email",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReminder = async (reminderType: '30_day' | '7_day' | 'payment_received') => {
    if (!booking.contact_email) {
      toast({
        title: "No Email Address",
        description: "This booking doesn't have an email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSendingReminder(true);
      
      const result = await emailService.sendPaymentReminder(booking, invoice, reminderType);
      
      if (result.success) {
        toast({
          title: "Reminder Sent! ✓",
          description: `Payment reminder sent to ${booking.contact_email}`,
        });
        // Reload to get updated reminder history
        await loadOrCreateInvoice();
      } else {
        throw new Error(result.error || "Failed to send reminder");
      }
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Failed to Send Reminder",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingReminder(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const validPayments = (booking.payments || []).filter(p => p && p.amount && p.amount > 0);
    const actualAmountPaid = validPayments.length > 0
      ? validPayments.reduce((sum, p) => sum + p.amount, 0) 
      : 0;
    const actualBalanceDue = invoice.total_amount - actualAmountPaid;
    const hasPayments = validPayments.length > 0 && actualAmountPaid > 0;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; background: white; }
          .invoice { max-width: 850px; margin: 40px auto; background: white; padding: 60px; }
          
          .logo-container { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #0f766e; }
          .logo-image { width: 280px; height: auto; margin: 0 auto 10px; display: block; }
          
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 50px; }
          
          .invoice-meta { text-align: right; }
          .invoice-meta h2 { font-size: 36px; color: #1e293b; margin-bottom: 8px; font-weight: 300; letter-spacing: -1px; }
          .invoice-number { font-size: 18px; color: #0f766e; font-weight: 600; margin-bottom: 12px; }
          .invoice-date { font-size: 14px; color: #64748b; }
          
          .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
          .billing-box { background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #0f766e; }
          .billing-box h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 15px; font-weight: 600; }
          .billing-box p { font-size: 15px; color: #1e293b; line-height: 1.8; margin: 4px 0; }
          .billing-box strong { display: block; font-size: 18px; color: #0f766e; margin-bottom: 8px; }
          
          .event-details { background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 30px 0; }
          .event-details h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; margin-bottom: 15px; font-weight: 600; }
          .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .detail-item { display: flex; justify-content: space-between; padding: 8px 0; }
          .detail-label { color: #64748b; font-size: 14px; }
          .detail-value { color: #1e293b; font-weight: 600; font-size: 14px; }
          
          .items-table { width: 100%; margin: 40px 0; border-collapse: collapse; }
          .items-table thead { background: #f1f5f9; }
          .items-table th { padding: 15px 20px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
          .items-table td { padding: 18px 20px; color: #334155; font-size: 15px; border-bottom: 1px solid #f1f5f9; }
          .items-table tr:last-child td { border-bottom: none; }
          .items-table .amount { text-align: right; font-weight: 600; font-size: 16px; }
          
          .totals { margin-top: 30px; padding-top: 30px; border-top: 2px solid #e2e8f0; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 16px; }
          .total-row.subtotal { color: #64748b; }
          .total-row.payment { color: #059669; font-weight: 600; }
          .total-row.balance { color: #ea580c; font-weight: 600; }
          .total-row.grand-total { background: #ecfdf5; border: 2px solid #0f766e; border-radius: 8px; margin-top: 15px; padding: 20px; font-size: 20px; font-weight: 700; color: #0f766e; }
          
          .payment-terms { margin-top: 50px; padding: 25px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .payment-terms h4 { color: #92400e; font-size: 14px; margin-bottom: 10px; font-weight: 600; }
          .payment-terms p { color: #78350f; font-size: 13px; line-height: 1.6; }
          
          .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer p { color: #64748b; font-size: 13px; line-height: 1.8; }
          .footer strong { color: #1e293b; }
          
          @media print { 
            body { padding: 0; margin: 0; }
            .invoice { margin: 0; padding: 40px; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="logo-container">
            <img src="/ChatGPT_Image_Nov_5_2025_03_58_44_PM.png" alt="Trout Lake Resort Logo" class="logo-image" />
          </div>

          <div class="header">
            <div style="flex: 1;"></div>
            <div class="invoice-meta">
              <h2>INVOICE</h2>
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <div class="invoice-date">Issue Date: ${format(new Date(invoice.created_at), "MMMM dd, yyyy")}</div>
            </div>
          </div>

          <div class="billing-section">
            <div class="billing-box">
              <h3>Bill To</h3>
              <strong>${invoice.client_name}</strong>
              ${invoice.client_email ? `<p>${invoice.client_email}</p>` : ""}
              ${invoice.client_phone ? `<p>${invoice.client_phone}</p>` : ""}
            </div>
            
            <div class="billing-box">
              <h3>Event Information</h3>
              <strong>${invoice.number_of_guests} Guests</strong>
              <p>${format(new Date(invoice.event_date_start), "EEEE, MMMM dd, yyyy")}</p>
              <p>through</p>
              <p>${format(new Date(invoice.event_date_end), "EEEE, MMMM dd, yyyy")}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 70%">Description</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Event Venue Rental</strong><br>
                  <span style="font-size: 13px; color: #64748b;">
                    ${invoice.number_of_guests} guests<br>
                    ${format(new Date(invoice.event_date_start), "MMM dd")} - ${format(new Date(invoice.event_date_end), "MMM dd, yyyy")}
                  </span>
                </td>
                <td class="amount">$${Number(invoice.base_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row subtotal">
              <span>Subtotal</span>
              <span>$${Number(invoice.base_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${hasPayments ? `
            <div class="total-row payment">
              <span>Amount Paid</span>
              <span>-$${actualAmountPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row balance">
              <span>Balance Due</span>
              <span>$${actualBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total Amount</span>
              <span>$${Number(invoice.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style="margin-top: 40px; padding: 25px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 12px; font-weight: 600;">Payment Instructions</h4>
            <p style="color: #1e293b; font-size: 13px; line-height: 1.8; margin-bottom: 8px;">
              <strong>Checks:</strong> Please make checks payable to <strong>Cong Zera Kodesh</strong>
            </p>
            <p style="color: #1e293b; font-size: 13px; line-height: 1.8;">
              <strong>E-Transfer:</strong> Send to <strong>billing@troutlakeresort.ca</strong>
            </p>
          </div>

          ${hasPayments && actualBalanceDue > 0 ? `
          <div class="payment-terms">
            <h4>⚠ Payment Required</h4>
            <p>A balance of <strong>$${actualBalanceDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> remains outstanding. Please remit payment by the agreed due date to maintain your reservation.</p>
          </div>
          ` : hasPayments && actualBalanceDue <= 0 ? `
          <div class="payment-terms" style="background: #d1fae5; border-left-color: #059669;">
            <h4 style="color: #065f46;">✓ Paid in Full</h4>
            <p style="color: #047857;">Thank you! Your payment has been received and your reservation is confirmed.</p>
          </div>
          ` : `
          <div class="payment-terms">
            <h4>⚠ Payment Required</h4>
            <p>Full payment of <strong>$${Number(invoice.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is required. Please remit payment by the agreed due date to maintain your reservation.</p>
          </div>
          `}

          ${invoice.notes ? `
          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h4 style="color: #475569; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Additional Notes</h4>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">${invoice.notes}</p>
          </div>
          ` : ""}

          <div class="footer">
            <p><strong>Thank you for choosing Trout Lake Resort!</strong></p>
            <p>For questions regarding this invoice, please contact our booking office.</p>
            <p style="margin-top: 15px; font-size: 12px;">This is a computer-generated invoice.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading invoice...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) return null;

  const validPayments = (booking.payments || []).filter(p => p && p.amount && p.amount > 0);
  const actualAmountPaid = validPayments.length > 0
    ? validPayments.reduce((sum, p) => sum + p.amount, 0) 
    : 0;
  const actualBalanceDue = invoice.total_amount - actualAmountPaid;
  const hasPayments = validPayments.length > 0 && actualAmountPaid > 0;

  const getEmailStatusBadge = () => {
    if (!invoice.email_sent_at) {
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Not Sent</Badge>;
    }
    
    if (invoice.email_status === 'sent') {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Sent {format(new Date(invoice.email_sent_at), "MMM d, h:mm a")}
        </Badge>
      );
    }
    
    if (invoice.email_status === 'failed') {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {invoice.invoice_number}
              {getEmailStatusBadge()}
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={handleSendEmail} 
                variant="default"
                size="sm"
                disabled={sendingEmail || !invoice.client_email}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send by Email
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {actualBalanceDue > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Payment Reminder Tools
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  Outstanding balance: <strong>${actualBalanceDue.toFixed(2)}</strong>
                  {invoice.last_reminder_sent_at && (
                    <span className="ml-2 text-xs">
                      (Last reminder: {format(new Date(invoice.last_reminder_sent_at), "MMM d, h:mm a")})
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendReminder('30_day')}
                    variant="outline"
                    size="sm"
                    disabled={sendingReminder || !booking.contact_email}
                    className="text-xs"
                  >
                    Send 30-Day Reminder
                  </Button>
                  <Button
                    onClick={() => handleSendReminder('7_day')}
                    variant="outline"
                    size="sm"
                    disabled={sendingReminder || !booking.contact_email}
                    className="text-xs"
                  >
                    Send 7-Day Reminder
                  </Button>
                </div>
              </div>
              {invoice.reminder_count ? (
                <Badge variant="secondary">{invoice.reminder_count} reminder{invoice.reminder_count > 1 ? 's' : ''} sent</Badge>
              ) : null}
            </div>
          </div>
        )}

        {actualBalanceDue <= 0 && hasPayments && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Payment Received Confirmation</h4>
                <p className="text-sm text-green-700">Send a thank you email confirming payment.</p>
              </div>
              <Button
                onClick={() => handleSendReminder('payment_received')}
                variant="outline"
                size="sm"
                disabled={sendingReminder || !booking.contact_email}
                className="bg-green-100 hover:bg-green-200 text-green-800"
              >
                Send Confirmation
              </Button>
            </div>
          </div>
        )}

        {reminderHistory.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-slate-900 mb-3 text-sm">Reminder History</h4>
            <div className="space-y-2">
              {reminderHistory.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {reminder.reminder_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={reminder.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                      {reminder.status}
                    </Badge>
                    <span className="text-slate-500">
                      {format(new Date(reminder.sent_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border rounded-lg p-8 space-y-6">
          {generating && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              Invoice generated successfully!
            </div>
          )}

          <div className="text-center border-b pb-6 mb-6">
            <img 
              src="/ChatGPT_Image_Nov_5_2025_03_58_44_PM.png" 
              alt="Trout Lake Resort Logo" 
              className="w-64 h-auto mx-auto mb-2"
            />
          </div>

          <div className="flex justify-between items-start">
            <div></div>
            <div className="text-right">
              <h3 className="text-4xl font-light text-gray-800 mb-2">INVOICE</h3>
              <p className="text-lg font-semibold text-blue-600">#{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500 mt-1">Issue Date: {format(new Date(invoice.created_at), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-600">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Bill To</h3>
              <p className="text-lg font-bold text-gray-800 mb-2">{invoice.client_name}</p>
              {invoice.client_email && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {invoice.client_email}
                </p>
              )}
              {invoice.client_phone && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Phone className="h-3 w-3" /> {invoice.client_phone}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
              <h3 className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-3">Event Information</h3>
              <p className="text-lg font-bold text-gray-800 mb-2">
                {invoice.number_of_guests} Guests
              </p>
              <p className="text-sm text-gray-700">{format(new Date(invoice.event_date_start), "EEEE, MMMM dd, yyyy")}</p>
              <p className="text-xs text-gray-500">through</p>
              <p className="text-sm text-gray-700">{format(new Date(invoice.event_date_end), "EEEE, MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-gray-600 font-semibold">Description</th>
                  <th className="text-right p-4 text-xs uppercase tracking-wide text-gray-600 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">Event Venue Rental</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {invoice.number_of_guests} guests
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(invoice.event_date_start), "MMM dd")} - {format(new Date(invoice.event_date_end), "MMM dd, yyyy")}
                    </p>
                  </td>
                  <td className="p-4 text-right font-semibold text-lg">${Number(invoice.base_price).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 space-y-3 border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">${Number(invoice.base_price).toFixed(2)}</span>
              </div>
              {hasPayments && (
                <>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Amount Paid:</span>
                    <span>-${actualAmountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Balance Due:</span>
                    <span>${actualBalanceDue.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-2xl font-bold bg-blue-50 border-2 border-blue-600 p-4 rounded-lg mt-4">
                <span className="text-blue-800">Total Amount:</span>
                <span className="text-blue-600">${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {hasPayments && actualBalanceDue > 0 ? (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-semibold text-amber-800 mb-1">⚠ Payment Required</h4>
              <p className="text-sm text-amber-700">
                A balance of <strong>${actualBalanceDue.toFixed(2)}</strong> remains outstanding. 
                Please remit payment by the agreed due date to maintain your reservation.
              </p>
            </div>
          ) : hasPayments && actualBalanceDue <= 0 ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-1">✓ Paid in Full</h4>
              <p className="text-sm text-green-700">
                Thank you! Your payment has been received and your reservation is confirmed.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-semibold text-amber-800 mb-1">⚠ Payment Required</h4>
              <p className="text-sm text-amber-700">
                Full payment of <strong>${Number(invoice.total_amount).toFixed(2)}</strong> is required. 
                Please remit payment by the agreed due date to maintain your reservation.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 text-base">Payment Instructions</h4>
            <div className="space-y-2 text-sm text-blue-900">
              <p>
                <strong>Checks:</strong> Please make checks payable to <strong>Cong Zera Kodesh</strong>
              </p>
              <p>
                <strong>E-Transfer:</strong> Send to <strong>billing@troutlakeresort.ca</strong>
              </p>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 border-t pt-6 mt-8">
            <p className="font-semibold text-gray-700 mb-1">Thank you for choosing Trout Lake Resort!</p>
            <p>For questions regarding this invoice, please contact our booking office.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
