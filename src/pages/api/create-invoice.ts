import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables for debugging
  console.log("🔍 API Route Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    keyValue: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30)
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing Supabase credentials in API route");
      return res.status(500).json({ 
        error: "Server configuration error: Missing Supabase credentials",
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey,
          envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
        }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const {
      bookingId,
      clientName,
      clientEmail,
      clientPhone,
      totalAmount,
      depositAmount,
      balanceDue,
      eventDateStart,
      eventDateEnd,
      numberOfGuests,
      numberOfRooms,
      basePrice,
      notes,
      invoiceNumber,
      status = "pending"
    } = req.body;

    if (!bookingId || !totalAmount) {
      return res.status(400).json({
        error: "Missing required fields: bookingId and totalAmount are required"
      });
    }

    console.log("📝 Creating invoice for booking:", bookingId);

    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber) {
      const year = new Date().getFullYear();
      const { count } = await supabaseAdmin
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .like("invoice_number", `INV-${year}-%`);
      const next = String((count ?? 0) + 1).padStart(4, "0");
      finalInvoiceNumber = `INV-${year}-${next}`;
    }

    const insertRow: Record<string, unknown> = {
      booking_id: bookingId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      total_amount: totalAmount,
      deposit_amount: depositAmount || 0,
      balance_due: balanceDue || totalAmount,
      invoice_number: finalInvoiceNumber,
      status: status,
    };
    if (eventDateStart) insertRow.event_date_start = eventDateStart;
    if (eventDateEnd) insertRow.event_date_end = eventDateEnd;
    if (numberOfGuests != null) insertRow.number_of_guests = numberOfGuests;
    if (numberOfRooms != null) insertRow.number_of_rooms = numberOfRooms;
    if (basePrice != null) insertRow.base_price = basePrice;
    if (notes) insertRow.notes = notes;

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error("❌ Database error creating invoice:", error);
      return res.status(500).json({ 
        error: error.message,
        details: error
      });
    }

    console.log("✅ Invoice created successfully:", invoice?.id);
    return res.status(200).json({ invoice });

  } catch (error) {
    console.error("❌ Unexpected error in create-invoice API:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}