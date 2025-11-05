import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";
import { invoiceService } from "@/services/invoiceService";
import { format } from "date-fns";
import { Download, Loader2, FileText, Building2, Mail, Phone } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

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
        
        // Calculate actual amount paid from payments
        const amountPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const balanceDue = booking.totalCost - amountPaid;
        
        existingInvoice = await invoiceService.createInvoice(booking.id, {
          clientName: booking.contactName,
          clientEmail: booking.contactEmail || undefined,
          clientPhone: booking.contactPhone || undefined,
          eventDateStart: booking.startDate,
          eventDateEnd: booking.endDate,
          numberOfGuests: booking.numberOfGuests,
          numberOfRooms: booking.numberOfRooms,
          basePrice: booking.totalCost,
          depositAmount: amountPaid,
          balanceDue: balanceDue,
          totalAmount: booking.totalCost,
          notes: booking.notes || undefined
        });
      }

      setInvoice(existingInvoice);
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

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
            <div class="total-row payment">
              <span>Amount Paid</span>
              <span>-$${Number(invoice.deposit_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row balance">
              <span>Balance Due</span>
              <span>$${Number(invoice.balance_due).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
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
              <strong>E-Transfer:</strong> Send to <strong>thetroutlakeresort@gmail.com</strong>
            </p>
          </div>

          ${invoice.balance_due > 0 ? `
          <div class="payment-terms">
            <h4>⚠ Payment Required</h4>
            <p>A balance of <strong>$${Number(invoice.balance_due).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> remains outstanding. Please remit payment by the agreed due date to maintain your reservation.</p>
          </div>
          ` : `
          <div class="payment-terms" style="background: #d1fae5; border-left-color: #059669;">
            <h4 style="color: #065f46;">✓ Paid in Full</h4>
            <p style="color: #047857;">Thank you! Your payment has been received and your reservation is confirmed.</p>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {invoice.invoice_number}
            </span>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

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
              <div className="flex justify-between text-green-600 font-medium">
                <span>Amount Paid:</span>
                <span>-${Number(invoice.deposit_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-medium">
                <span>Balance Due:</span>
                <span>${Number(invoice.balance_due).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold bg-blue-50 border-2 border-blue-600 p-4 rounded-lg mt-4">
                <span className="text-blue-800">Total Amount:</span>
                <span className="text-blue-600">${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.balance_due > 0 ? (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-semibold text-amber-800 mb-1">⚠ Payment Required</h4>
              <p className="text-sm text-amber-700">
                A balance of <strong>${Number(invoice.balance_due).toFixed(2)}</strong> remains outstanding. 
                Please remit payment by the agreed due date to maintain your reservation.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-1">✓ Paid in Full</h4>
              <p className="text-sm text-green-700">
                Thank you! Your payment has been received and your reservation is confirmed.
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
                <strong>E-Transfer:</strong> Send to <strong>thetroutlakeresort@gmail.com</strong>
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
