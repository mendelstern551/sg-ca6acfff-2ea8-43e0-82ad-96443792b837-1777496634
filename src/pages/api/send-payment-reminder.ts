import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { booking, invoice, reminderType } = req.body;

  if (!booking || !reminderType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_AUTH_USER;
  const SMTP_PASS = process.env.SMTP_AUTH_PASS;
  const FROM_EMAIL = process.env.BILLING_FROM_EMAIL || "billing@troutlakeresort.ca";

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({
      error: "Email service not configured. Please contact support.",
    });
  }

  let emailSubject = "Payment Reminder";
  let emailContent = "";

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.verify();

    const balanceDue = invoice?.balance_due || booking.balance_due;
    const eventDate = format(new Date(booking.start_date), "MMMM dd, yyyy");

    switch (reminderType) {
      case "30_day":
        emailSubject = `Payment Reminder: Your Event at Trout Lake Resort (30 Days)`;
        emailContent = `
          <p>Dear ${booking.contact_name},</p>
          <p>This is a friendly reminder that your event at Trout Lake Resort is scheduled for <strong>${eventDate}</strong>, which is approximately 30 days away.</p>
          <p><strong>Outstanding Balance: $${balanceDue.toFixed(2)}</strong></p>
          <p>To ensure your reservation remains confirmed, please submit payment at your earliest convenience.</p>
        `;
        break;

      case "7_day":
        emailSubject = `⚠️ Payment Due Soon: Event in 7 Days`;
        emailContent = `
          <p>Dear ${booking.contact_name},</p>
          <p>Your event at Trout Lake Resort is coming up in just <strong>7 days</strong> on ${eventDate}.</p>
          <p><strong>Outstanding Balance: $${balanceDue.toFixed(2)}</strong></p>
          <p>Please submit payment immediately to avoid any issues with your reservation.</p>
        `;
        break;

      case "payment_received":
        emailSubject = `✓ Payment Received - Thank You!`;
        emailContent = `
          <p>Dear ${booking.contact_name},</p>
          <p>We're writing to confirm that we have received your payment!</p>
          <p>Your reservation for ${eventDate} is now fully confirmed and paid.</p>
          <p>We look forward to hosting you at Trout Lake Resort!</p>
        `;
        break;

      default:
        return res.status(400).json({ error: "Invalid reminder type" });
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #0f766e, #0ea5e9); color: white; padding: 30px; border-radius: 8px; }
    .content-box { background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; }
    .payment-info { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Trout Lake Resort</h1>
      <p style="margin: 10px 0 0 0;">Sainte-Agathe-des-Monts • Canada</p>
    </div>

    <div class="content-box">
      ${emailContent}

      ${reminderType !== 'payment_received' ? `
      <div class="payment-info">
        <h3 style="margin-top: 0;">Payment Instructions</h3>
        <p><strong>Checks:</strong> Make payable to <strong>Cong Zera Kodesh</strong></p>
        <p><strong>E-Transfer:</strong> Send to <strong>billing@troutlakeresort.ca</strong></p>
      </div>
      ` : ''}

      <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
    </div>

    <div class="footer">
      <p>Trout Lake Resort</p>
      <p>billing@troutlakeresort.ca</p>
      <p style="margin-top: 15px; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"Trout Lake Resort - Billing" <${FROM_EMAIL}>`,
      to: booking.contact_email,
      subject: emailSubject,
      html: emailHtml,
    });

    // ✅ LOG EMAIL TO DATABASE
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from("email_logs").insert({
        booking_id: booking.id || null,
        email_type: "payment_reminder",
        recipient_email: booking.contact_email,
        recipient_name: booking.contact_name,
        subject: emailSubject,
        status: "sent",
        metadata: {
          reminder_type: reminderType,
          balance_due: balanceDue,
          event_date: booking.start_date
        }
      });

      console.log("✅ Email logged to database");
    } catch (logError) {
      console.error("⚠️ Failed to log email to database:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Payment reminder sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending payment reminder:", error);
    
    // ✅ LOG FAILED EMAIL
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from("email_logs").insert({
        booking_id: booking.id || null,
        email_type: "payment_reminder",
        recipient_email: booking.contact_email,
        recipient_name: booking.contact_name,
        subject: emailSubject,
        status: "failed",
        error_message: error.message,
        metadata: {
          reminder_type: reminderType,
          error_code: error.code
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log failed email:", logError);
    }

    return res.status(500).json({
      error: "Failed to send payment reminder",
      details: error.message,
    });
  }
}
