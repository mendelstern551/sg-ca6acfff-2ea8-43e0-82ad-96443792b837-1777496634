import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create admin client that bypasses RLS and PostgREST cache
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      booking_id,
      invoice_number,
      total_amount,
      deposit_amount,
      balance_due,
      status,
      due_date,
      client_name,
      client_email,
      client_phone
    } = req.body;

    // Validate required fields
    if (!booking_id || !invoice_number || total_amount === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: booking_id, invoice_number, total_amount" 
      });
    }

    // Direct insert bypassing PostgREST entirely
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        booking_id,
        invoice_number,
        total_amount: Number(total_amount),
        deposit_amount: Number(deposit_amount || 0),
        balance_due: Number(balance_due || total_amount),
        status: status || "unpaid",
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        client_name: client_name || null,
        client_email: client_email || null,
        client_phone: client_phone || null
      })
      .select()
      .single();

    if (error) {
      console.error("Invoice creation error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}