import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Users,
  DollarSign,
  FileText,
  Receipt,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

// Force SSR so middleware actually runs (see lib/force-dynamic.ts).
export { getServerSideProps } from "@/lib/force-dynamic";

interface BookingRow {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  start_date: string | null;
  end_date: string | null;
  number_of_guests: number | null;
  number_of_rooms: number | null;
  total_cost: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  deposit_amount: number | null;
  payment_status: string | null;
  confirmed: boolean | null;
  notes: string | null;
  booking_type: string | null;
  created_at: string | null;
}

interface PaymentRow {
  id: string;
  booking_id: string;
  amount: number;
  payment_date: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  status: string | null;
  total_amount: number | null;
  balance_due: number | null;
  deposit_amount: number | null;
  created_at: string | null;
  event_date_start: string | null;
  event_date_end: string | null;
}

interface ExpenseRow {
  id: string;
  description: string | null;
  amount: number | null;
  category: string | null;
  vendor: string | null;
  expense_date: string | null;
  payment_method: string | null;
}

interface EmailLogRow {
  id: string;
  email_type: string | null;
  subject: string | null;
  recipient_email: string | null;
  status: string | null;
  // The live schema uses `sent_at`; some generated types call it `created_at`.
  // We coalesce both fields when displaying.
  sent_at?: string | null;
  created_at?: string | null;
}

const fmtUSD = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtDate = (d: string | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
  d ? new Date(d).toLocaleDateString("en-US", opts ?? { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function BookingDossier() {
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof router.query.id === "string" ? router.query.id : null;

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [emails, setEmails] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!router.isReady || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [b, p, i, e, m] = await Promise.all([
          supabase.from("bookings").select("*").eq("id", id).maybeSingle(),
          supabase.from("payments").select("*").eq("booking_id", id).order("payment_date", { ascending: false }),
          supabase.from("invoices").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
          supabase.from("expenses").select("*").eq("booking_id", id).order("expense_date", { ascending: false }),
          supabase.from("email_logs").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
        ]);
        if (cancelled) return;
        if (!b.data) {
          setNotFound(true);
        } else {
          setBooking(b.data as unknown as BookingRow);
        }
        // Generated TS types in @/integrations/supabase/types.ts can lag the live schema —
        // the runtime DB (this project) carries the columns we read here. Cast loosely so
        // type drift doesn't fail the build.
        setPayments((p.data as unknown as PaymentRow[]) || []);
        setInvoices((i.data as unknown as InvoiceRow[]) || []);
        setExpenses((e.data as unknown as ExpenseRow[]) || []);
        setEmails((m.data as unknown as EmailLogRow[]) || []);
      } catch (err) {
        console.error("Dossier load failed:", err);
        toast({
          title: "Could not load",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Booking not found</CardTitle>
            <CardDescription>The booking ID in the URL doesn't exist (or was deleted).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstanding = (Number(booking.total_cost) || 0) - totalPaid;
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const grossProfit = (Number(booking.total_cost) || 0) - totalExpenses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{booking.name || "Booking"}</h1>
              <p className="text-sm text-muted-foreground">
                Full dossier · {booking.contact_name || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline">
              <Link href={`/?tab=bookings&focus=${booking.id}&action=edit`}>
                <ExternalLink className="h-4 w-4 mr-2" /> Open booking (edit)
              </Link>
            </Button>
            {invoices.length > 0 && (
              <Button asChild variant="outline">
                <Link href={`/?tab=invoices&focus=${invoices[0].id}`}>
                  <FileText className="h-4 w-4 mr-2" /> Invoices ({invoices.length})
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/?tab=expenses&booking=${booking.id}`}>
                <Receipt className="h-4 w-4 mr-2" /> Expenses ({expenses.length})
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking summary
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant={booking.confirmed ? "default" : "secondary"}>
                  {booking.confirmed ? "Confirmed" : "Tentative"}
                </Badge>
                <Badge
                  className={
                    booking.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : booking.payment_status === "partial"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-orange-100 text-orange-700"
                  }
                >
                  {booking.payment_status || "pending"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <Field icon={Calendar} label="Event dates" value={`${fmtDate(booking.start_date)} – ${fmtDate(booking.end_date)}`} />
              <Field icon={Users} label="Guests / Rooms" value={`${booking.number_of_guests ?? "—"} guests · ${booking.number_of_rooms ?? "—"} rooms`} />
              <Field icon={User} label="Contact" value={booking.contact_name || "—"} />
              <Field icon={Mail} label="Email" value={booking.contact_email || "—"} mono />
              <Field icon={Phone} label="Phone" value={booking.contact_phone || "—"} mono />
              <Field icon={DollarSign} label="Total cost" value={fmtUSD(booking.total_cost)} />
              <Field icon={CheckCircle2} label="Total paid" value={fmtUSD(totalPaid)} accent="text-emerald-700 dark:text-emerald-400" />
              <Field icon={AlertCircle} label="Outstanding" value={fmtUSD(outstanding)} accent={outstanding > 0 ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"} />
            </div>
            {booking.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Two-up: Invoices + Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Invoices ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet for this booking.</p>
              ) : (
                <ul className="space-y-2">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="flex items-start justify-between p-3 rounded-md border bg-muted/30">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold">{inv.invoice_number}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(inv.created_at)} · {inv.status}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-sm font-semibold">{fmtUSD(inv.total_amount)}</div>
                        {Number(inv.balance_due) > 0 && (
                          <div className="text-xs text-orange-600">{fmtUSD(inv.balance_due)} due</div>
                        )}
                        <Link
                          href={`/?tab=invoices&focus=${inv.id}`}
                          className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                        >
                          Open <ExternalLink className="h-3 w-3 ml-0.5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Payment history ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {payments.map((pmt) => (
                    <li key={pmt.id} className="flex items-start justify-between p-3 rounded-md border bg-muted/30">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{fmtUSD(pmt.amount)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(pmt.payment_date)} · {pmt.payment_method || "—"}
                        </div>
                        {pmt.reference_number && (
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                            ref: {pmt.reference_number}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Expenses for this booking ({expenses.length})
              </CardTitle>
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold">{fmtUSD(totalExpenses)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses logged for this booking.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ex.description || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(ex.expense_date)} · {ex.category || "uncategorized"}
                        {ex.vendor && ` · ${ex.vendor}`}
                      </div>
                    </div>
                    <div className="font-semibold shrink-0 ml-3">{fmtUSD(ex.amount)}</div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between p-2.5 text-sm">
                  <span className="text-muted-foreground">
                    Booking total minus expenses
                  </span>
                  <span className={"font-semibold " + (grossProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                    {fmtUSD(grossProfit)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emails sent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email history ({emails.length})
            </CardTitle>
            <CardDescription>All emails sent or scheduled for this booking.</CardDescription>
          </CardHeader>
          <CardContent>
            {emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emails sent for this booking.</p>
            ) : (
              <ul className="space-y-2">
                {emails.map((em) => {
                  const StatusIcon =
                    em.status === "sent" ? CheckCircle2 : em.status === "failed" ? AlertCircle : Clock;
                  const statusColor =
                    em.status === "sent"
                      ? "text-emerald-600"
                      : em.status === "failed"
                      ? "text-rose-600"
                      : "text-amber-600";
                  return (
                    <li key={em.id} className="flex items-start gap-3 p-2.5 rounded-md border bg-muted/30">
                      <StatusIcon className={`h-4 w-4 mt-0.5 ${statusColor}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{em.subject || "(no subject)"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {em.email_type} · {em.recipient_email} · {fmtDate(em.created_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{em.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""} ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
