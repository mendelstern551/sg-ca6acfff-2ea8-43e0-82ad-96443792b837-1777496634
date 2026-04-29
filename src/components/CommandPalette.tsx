import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  FileText,
  Mail,
  TrendingUp,
  Briefcase,
  Receipt,
  DollarSign,
  Home,
  MessageSquare,
  Plus,
  Search,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";

/**
 * Global ⌘K / Ctrl+K command palette.
 *
 * Opens from anywhere. Loads bookings + invoices once on first open and reuses them.
 * Searches across name, contact, email, phone, invoice number. Selecting a booking
 * navigates to /?tab=bookings&focus=<id>; selecting an invoice → /?tab=invoices&focus=<id>.
 * Also exposes "Jump to tab" navigation commands and quick actions.
 */

interface PaletteBooking {
  id: string;
  name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  start_date: string | null;
}
interface PaletteInvoice {
  id: string;
  invoice_number: string | null;
  client_name: string | null;
  client_email: string | null;
  status: string | null;
  total_amount: number | null;
  booking_id: string | null;
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "calendar", label: "Calendar", icon: Home },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "manager", label: "Manager", icon: Briefcase },
  { id: "margin", label: "Event Margin", icon: TrendingUp },
  { id: "communications", label: "Communications", icon: Mail },
  { id: "emails", label: "Email History", icon: MessageSquare },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "insights", label: "Insights", icon: TrendingUp },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<PaletteBooking[]>([]);
  const [invoices, setInvoices] = useState<PaletteInvoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Toggle on ⌘K / Ctrl+K, and via a synthetic `palette:open` event so any button can open it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onCustom = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onCustom);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", onCustom);
    };
  }, []);

  // Lazy-load data on first open
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      try {
        const [b, i] = await Promise.all([
          supabase
            .from("bookings")
            .select("id,name,contact_name,contact_email,contact_phone,start_date")
            .order("start_date", { ascending: false })
            .limit(200),
          supabase
            .from("invoices")
            .select("id,invoice_number,client_name,client_email,status,total_amount,booking_id")
            .order("created_at", { ascending: false })
            .limit(200),
        ]);
        if (b.data) setBookings(b.data as PaletteBooking[]);
        if (i.data) setInvoices(i.data as PaletteInvoice[]);
      } catch (err) {
        console.warn("Command palette load failed:", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [open, loaded]);

  const close = () => setOpen(false);

  const goToTab = (tab: string, focusId?: string) => {
    const query: Record<string, string> = { tab };
    if (focusId) query.focus = focusId;
    router.push({ pathname: "/", query });
    close();
  };

  const goToBookingDossier = (bookingId: string) => {
    router.push(`/dossier/${bookingId}`);
    close();
  };

  const fmtDate = (s: string | null) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };
  const fmtMoney = (n: number | null) =>
    n == null
      ? ""
      : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search bookings, invoices, contacts… (try a name, email, or phone)" />
      <CommandList>
        <CommandEmpty>
          {loaded ? "No matches." : (
            <span className="flex items-center gap-2 justify-center py-3 text-muted-foreground">
              <Search className="h-4 w-4 animate-pulse" /> Loading…
            </span>
          )}
        </CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem value="new booking add" onSelect={() => goToTab("bookings")}>
            <Plus className="mr-2 h-4 w-4" />
            New booking
          </CommandItem>
          <CommandItem value="new invoice" onSelect={() => goToTab("invoices")}>
            <FileText className="mr-2 h-4 w-4" />
            View invoices
          </CommandItem>
          <CommandItem value="send email communications" onSelect={() => goToTab("communications")}>
            <Mail className="mr-2 h-4 w-4" />
            Send client email
          </CommandItem>
          <CommandItem value="event margin profit" onSelect={() => goToTab("margin")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Open profit calculator
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jump to">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <CommandItem
                key={t.id}
                value={`tab ${t.id} ${t.label}`}
                onSelect={() => goToTab(t.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {t.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {bookings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Bookings · ${bookings.length}`}>
              {bookings.map((b) => {
                const haystack = [
                  b.name,
                  b.contact_name,
                  b.contact_email,
                  b.contact_phone,
                  fmtDate(b.start_date),
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <CommandItem
                    key={b.id}
                    value={haystack}
                    onSelect={() => {
                      // Open the booking edit dialog directly (per latest UX).
                      // Use `action=edit` so /index reads it and opens the dialog after navigating.
                      router.push({
                        pathname: "/",
                        query: { tab: "bookings", focus: b.id, action: "edit" },
                      });
                      close();
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{b.name || "Untitled booking"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[fmtDate(b.start_date), b.contact_name, b.contact_email]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="Add payment to…">
              {bookings.map((b) => {
                const haystack = `pay payment ${b.name} ${b.contact_name ?? ""} ${b.contact_email ?? ""}`;
                return (
                  <CommandItem
                    key={`pay-${b.id}`}
                    value={haystack}
                    onSelect={() => {
                      // Tell the dashboard to open PaymentDialog for this booking.
                      window.dispatchEvent(
                        new CustomEvent("dialog:add-payment", { detail: { bookingId: b.id } })
                      );
                      close();
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">
                        {b.name || "Untitled booking"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Record a payment
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Invoices · ${invoices.length}`}>
              {invoices.map((inv) => {
                const haystack = [
                  inv.invoice_number,
                  inv.client_name,
                  inv.client_email,
                  inv.status,
                  fmtMoney(inv.total_amount),
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <CommandItem
                    key={inv.id}
                    value={haystack}
                    onSelect={() => {
                      // Invoice → its booking's dossier so user lands on the full picture.
                      // From there they can jump back into the focused invoice.
                      if (inv.booking_id) goToBookingDossier(inv.booking_id);
                      else goToTab("invoices", inv.id);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">
                        {inv.invoice_number || "Invoice"} — {inv.client_name || "Unknown"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[fmtMoney(inv.total_amount), inv.status, inv.client_email]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
