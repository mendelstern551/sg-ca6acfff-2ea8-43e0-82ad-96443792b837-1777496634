import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { invoiceService, type InvoiceWithDetails } from "@/services/invoiceService";
import { format } from "date-fns";
import { FileText, Download, Eye, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Force SSR so middleware actually runs (see lib/force-dynamic.ts).
export { getServerSideProps } from "@/lib/force-dynamic";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, statusFilter, invoices]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      
      // First sync all invoices with their payments
      await invoiceService.syncAllInvoicesWithPayments();
      
      // Then fix any invoice statuses that are incorrect
      await invoiceService.fixInvoiceStatuses();
      
      // Now load the updated invoices
      const invoices = await invoiceService.getAllInvoices();
      setInvoices(invoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleDownloadPDF = (invoice: InvoiceWithDetails) => {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      unpaid: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return variants[status] || variants.unpaid;
  };

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPaid = filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalOutstanding = filteredInvoices.filter(inv => inv.status === "unpaid").reduce((sum, inv) => sum + Number(inv.balance_due), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Invoice Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage all invoices for your bookings
            </p>
          </div>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">${totalInvoiced.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredInvoices.length} invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredInvoices.filter(i => i.status === "paid").length} paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredInvoices.filter(i => i.status === "unpaid").length} unpaid invoices</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Invoices
              </span>
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, client name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Invoices will appear here once bookings are created"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-semibold text-blue-600">{invoice.invoice_number}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(invoice.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{invoice.client_name}</p>
                        {invoice.client_email && (
                          <p className="text-xs text-gray-500">{invoice.client_email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(invoice.event_date_start), "MMM d")} - {format(new Date(invoice.event_date_end), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.number_of_guests} guests, {invoice.number_of_rooms} rooms
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-lg">${Number(invoice.total_amount).toFixed(2)}</p>
                        {Number(invoice.balance_due) > 0 && (
                          <p className="text-xs text-orange-600">
                            ${Number(invoice.balance_due).toFixed(2)} due
                          </p>
                        )}
                      </div>
                      <div>
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleDownloadPDF(invoice)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
