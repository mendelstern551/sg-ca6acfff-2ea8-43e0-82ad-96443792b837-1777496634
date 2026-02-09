import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get environment variables with explicit checks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // DETAILED DIAGNOSTIC LOGGING
    console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
    console.log("supabaseUrl:", supabaseUrl);
    console.log("serviceRoleKey exists:", !!serviceRoleKey);
    console.log("serviceRoleKey length:", serviceRoleKey?.length);
    console.log("serviceRoleKey first 50 chars:", serviceRoleKey?.substring(0, 50));
    console.log("Expected URL:", "https://qyphrzzhclfdkfjrsqsj.supabase.co");
    console.log("URLs match:", supabaseUrl === "https://qyphrzzhclfdkfjrsqsj.supabase.co");
    console.log("===================================");

    // Validate environment variables
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
        url: supabaseUrl,
        keyLength: serviceRoleKey?.length
      });
      return res.status(500).json({ 
        error: "Server configuration error: Missing Supabase credentials",
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey,
          urlValue: supabaseUrl
        }
      });
    }

    // Validate the key format (should be a JWT)
    if (!serviceRoleKey.startsWith("eyJ")) {
      console.error("Invalid service role key format - not a JWT");
      return res.status(500).json({
        error: "Invalid service role key format",
        debug: {
          keyPrefix: serviceRoleKey.substring(0, 20)
        }
      });
    }

    // Create admin client with service role key
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
      dueDate,
      invoiceNumber,
      status = "pending"
    } = req.body;

    // Validate required fields
    if (!bookingId || !totalAmount) {
      return res.status(400).json({ 
        error: "Missing required fields: bookingId and totalAmount are required" 
      });
    }

    console.log("Creating invoice with data:", {
      booking_id: bookingId,
      client_name: clientName,
      total_amount: totalAmount,
      deposit_amount: depositAmount || 0,
      balance_due: balanceDue || totalAmount
    });

    // Insert invoice directly using admin client
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        booking_id: bookingId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        total_amount: totalAmount,
        deposit_amount: depositAmount || 0,
        balance_due: balanceDue || totalAmount,
        due_date: dueDate,
        invoice_number: invoiceNumber,
        status: status
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating invoice:", error);
      return res.status(500).json({ 
        error: error.message,
        details: error,
        hint: "Check if RLS policies allow service_role to insert"
      });
    }

    console.log("Invoice created successfully:", invoice);
    return res.status(200).json({ invoice });

  } catch (error) {
    console.error("Unexpected error in create-invoice API:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.constructor.name : typeof error
    });
  }
}