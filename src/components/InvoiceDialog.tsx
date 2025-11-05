
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";
import { invoiceService } from "@/services/invoiceService";
import { format } from "date-fns";
import { Download, Loader2, FileText } from "lucide-react";
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
        existingInvoice = await invoiceService.createInvoice(booking.id, {
          clientName: booking.contactName,
          clientEmail: booking.contactEmail || undefined,
          clientPhone: booking.contactPhone || undefined,
          eventDateStart: booking.startDate,
          eventDateEnd: booking.endDate,
          numberOfGuests: booking.numberOfGuests,
          numberOfRooms: booking.numberOfRooms,
          basePrice: booking.totalCost,
          depositAmount: booking.depositAmount || 0,
          balanceDue: booking.balanceDue,
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
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .invoice-title { font-size: 24px; color: #475569; margin-top: 10px; }
          .invoice-number { color: #2563eb; font-weight: bold; }
          .section { margin: 25px 0; }
          .section-title { font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; }
          .client-info { background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-row { margin: 8px 0; color: #334155; }
          .info-label { font-weight: 600; display: inline-block; width: 140px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          .table tr:last-child td { border-bottom: none; }
          .amount { text-align: right; font-weight: 600; }
          .total-section { margin-top: 30px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
          .total-row.grand-total { border-top: 3px solid #2563eb; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: bold; color: #1e40af; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
          @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="company-name">Trout Lake Booking Management</div>
            <div class="invoice-title">Invoice <span class="invoice-number">#${invoice.invoice_number}</span></div>
            <div style="margin-top: 10px; color: #64748b;">Date: ${format(new Date(invoice.created_at), "MMMM dd, yyyy")}</div>
          </div>

          <div class="section">
            <div class="section-title">Bill To</div>
            <div class="client-info">
              <div class="info-row"><span class="info-label">Client Name:</span> ${invoice.client_name}</div>
              ${invoice.client_email ? `<div class="info-row"><span class="info-label">Email:</span> ${invoice.client_email}</div>` : ""}
              ${invoice.client_phone ? `<div class="info-row"><span class="info-label">Phone:</span> ${invoice.client_phone}</div>` : ""}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Event Details</div>
            <div class="client-info">
              <div class="info-row"><span class="info-label">Event Start:</span> ${format(new Date(invoice.event_date_start), "MMMM dd, yyyy")}</div>
              <div class="info-row"><span class="info-label">Event End:</span> ${format(new Date(invoice.event_date_end), "MMMM dd, yyyy")}</div>
              <div class="info-row"><span class="info-label">Number of Guests:</span> ${invoice.number_of_guests}</div>
              <div class="info-row"><span class="info-label">Number of Rooms:</span> ${invoice.number_of_rooms}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Cost Breakdown</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Event Price (${invoice.number_of_guests} guests, ${invoice.number_of_rooms} rooms)</td>
                  <td class="amount">$${Number(invoice.base_price).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Deposit Paid</td>
                  <td class="amount">-$${Number(invoice.deposit_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${Number(invoice.base_price).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Deposit Paid:</span>
                <span>-$${Number(invoice.deposit_amount).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Balance Due:</span>
                <span>$${Number(invoice.balance_due).toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Amount:</span>
                <span>$${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div class="client-info">
              <div class="info-row">${invoice.notes}</div>
            </div>
          </div>
          ` : ""}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 5px;">For questions about this invoice, please contact us.</p>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <div className="bg-white border rounded-lg p-6 space-y-6">
          {generating && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              Invoice generated successfully!
            </div>
          )}

          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-blue-600">Trout Lake Booking Management</h2>
            <p className="text-sm text-gray-500 mt-1">Date: {format(new Date(invoice.created_at), "MMMM dd, yyyy")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-medium">{invoice.client_name}</p>
                {invoice.client_email && <p className="text-sm text-gray-600">{invoice.client_email}</p>}
                {invoice.client_phone && <p className="text-sm text-gray-600">{invoice.client_phone}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Event Details</h3>
              <div className="bg-gray-50 p-4 rounded space-y-1">
                <p className="text-sm"><span className="font-medium">Start:</span> {format(new Date(invoice.event_date_start), "MMM dd, yyyy")}</p>
                <p className="text-sm"><span className="font-medium">End:</span> {format(new Date(invoice.event_date_end), "MMM dd, yyyy")}</p>
                <p className="text-sm"><span className="font-medium">Guests:</span> {invoice.number_of_guests}</p>
                <p className="text-sm"><span className="font-medium">Rooms:</span> {invoice.number_of_rooms}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Cost Breakdown</h3>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 text-sm">Base Event Price ({invoice.number_of_guests} guests, {invoice.number_of_rooms} rooms)</td>
                  <td className="p-3 text-sm text-right font-medium">${Number(invoice.base_price).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Deposit Paid</td>
                  <td className="p-3 text-sm text-right font-medium text-green-600">-${Number(invoice.deposit_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${Number(invoice.base_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deposit Paid:</span>
                <span className="font-medium text-green-600">-${Number(invoice.deposit_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance Due:</span>
                <span className="font-medium text-orange-600">${Number(invoice.balance_due).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total Amount:</span>
                <span className="text-blue-600">${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
