import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#ffffff"
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "3 solid #0f766e"
  },
  brandName: {
    fontSize: 26,
    color: "#0f766e",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    letterSpacing: 1
  },
  logoText: {
    fontSize: 10,
    color: "#64748b"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30
  },
  invoiceMeta: {
    alignItems: "flex-end"
  },
  invoiceTitle: {
    fontSize: 28,
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold"
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#0f766e",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold"
  },
  invoiceDate: {
    fontSize: 10,
    color: "#64748b"
  },
  billingSection: {
    flexDirection: "row",
    gap: 20,
    marginVertical: 25
  },
  billingBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 8,
    borderLeft: "4 solid #0f766e"
  },
  billingTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
    marginBottom: 12,
    fontFamily: "Helvetica-Bold"
  },
  billingName: {
    fontSize: 14,
    color: "#0f766e",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold"
  },
  billingDetail: {
    fontSize: 11,
    color: "#1e293b",
    marginVertical: 2
  },
  table: {
    marginVertical: 25
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderBottom: "2 solid #e2e8f0"
  },
  tableHeaderText: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#475569",
    fontFamily: "Helvetica-Bold"
  },
  tableRow: {
    flexDirection: "row",
    padding: 15,
    borderBottom: "1 solid #f1f5f9"
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2
  },
  amountText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold"
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: "2 solid #e2e8f0"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    fontSize: 12
  },
  grandTotal: {
    backgroundColor: "#ecfdf5",
    border: "2 solid #0f766e",
    borderRadius: 8,
    padding: 15,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  grandTotalText: {
    fontSize: 16,
    color: "#0f766e",
    fontFamily: "Helvetica-Bold"
  },
  paymentInstructions: {
    backgroundColor: "#eff6ff",
    padding: 20,
    borderRadius: 8,
    borderLeft: "4 solid #2563eb",
    marginTop: 25
  },
  paymentTitle: {
    fontSize: 11,
    color: "#1e40af",
    marginBottom: 10,
    fontFamily: "Helvetica-Bold"
  },
  paymentText: {
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.6,
    marginVertical: 3
  },
  statusBox: {
    padding: 20,
    borderRadius: 8,
    marginTop: 30
  },
  statusTitle: {
    fontSize: 11,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold"
  },
  statusText: {
    fontSize: 10,
    lineHeight: 1.5
  },
  notesBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
    marginTop: 20
  },
  notesTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#475569",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold"
  },
  notesText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1 solid #e2e8f0",
    alignItems: "center"
  },
  footerText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    marginVertical: 3
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    to,
    clientName,
    invoiceNumber,
    numberOfGuests,
    totalAmount,
    balanceDue,
    depositAmount,
    notes,
    bookingId,
  } = req.body;
  // Allow date fields to be reassigned with sanitized values below.
  let { eventDateStart, eventDateEnd } = req.body;

  if (!to || !clientName || !invoiceNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  // Sanitize dates so downstream toLocaleDateString never throws RangeError
  // on bad/missing client input.
  const safeDate = (d: unknown, fallback = ""): string => {
    if (!d) return fallback;
    const t = new Date(d as string).getTime();
    return isNaN(t) ? fallback : new Date(t).toISOString();
  };
  eventDateStart = safeDate(eventDateStart);
  eventDateEnd = safeDate(eventDateEnd, eventDateStart);
  if (!eventDateStart) {
    return res.status(400).json({ error: "Invalid eventDateStart" });
  }
  if (!isFinite(Number(totalAmount))) {
    return res.status(400).json({ error: "Invalid totalAmount" });
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_AUTH_USER;
  const SMTP_PASS = process.env.SMTP_AUTH_PASS;
  const FROM_EMAIL = process.env.INVOICE_FROM_EMAIL || "billing@troutlakeresort.ca";

  console.log("Email Configuration:", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    from: FROM_EMAIL,
    to: to,
  });

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP configuration is incomplete");
    return res.status(500).json({
      error: "Email service not configured. Please contact support.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      debug: true,
      logger: true,
    });

    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const hasPayments = depositAmount > 0;
    const actualBalanceDue = totalAmount - depositAmount;

    // Compact one-page email — the PDF carries the full formal invoice as an attachment.
    const fmtUSD = (n: number) =>
      Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
    const fmtDate = (d: string | Date) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f766e;padding:20px 28px;text-align:center;">
          <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:1px;">TROUT LAKE RESORT</div>
          <div style="color:#a7f3d0;font-size:12px;margin-top:2px;">Sainte-Agathe-des-Monts • Canada</div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;">Invoice</div>
              <div style="font-size:18px;font-weight:700;color:#0f766e;">${invoiceNumber}</div>
            </div>
            <div style="text-align:right;font-size:12px;color:#64748b;">${new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</div>
          </div>
          <p style="margin:0 0 12px;font-size:14px;">Dear ${clientName},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;">Your invoice is attached as a PDF. Summary below for quick reference.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">Event dates</td><td style="padding:8px 12px;text-align:right;">${fmtDate(eventDateStart)} – ${fmtDate(eventDateEnd)}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;">Guests</td><td style="padding:8px 12px;text-align:right;">${numberOfGuests}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">Subtotal</td><td style="padding:8px 12px;text-align:right;">${fmtUSD(totalAmount)}</td></tr>
            ${hasPayments ? `<tr><td style="padding:8px 12px;color:#16a34a;">Amount paid</td><td style="padding:8px 12px;text-align:right;color:#16a34a;">−${fmtUSD(depositAmount)}</td></tr>` : ""}
            <tr style="background:#ecfdf5;border-top:2px solid #0f766e;"><td style="padding:10px 12px;font-weight:700;color:#0f766e;">Balance due</td><td style="padding:10px 12px;text-align:right;font-weight:700;color:#0f766e;font-size:15px;">${fmtUSD(actualBalanceDue)}</td></tr>
          </table>
          <div style="margin-top:18px;padding:12px 14px;background:#f8fafc;border-left:3px solid #0f766e;border-radius:4px;font-size:12px;line-height:1.5;">
            <strong style="color:#0f766e;">Payment</strong><br/>
            Cheque to <strong>Cong Zera Kodesh</strong> · or e-transfer to <strong>billing@troutlakeresort.ca</strong>
          </div>
          ${notes ? `<p style="margin:14px 0 0;font-size:12px;color:#64748b;"><strong>Notes:</strong> ${notes}</p>` : ""}
        </td></tr>
        <tr><td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;">
          Questions? Reply to this email or contact billing@troutlakeresort.ca
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    console.log("Generating PDF invoice...");
    
    // Create PDF Document
    const InvoicePDF = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },
        React.createElement(
          View,
          { style: styles.logoContainer },
          React.createElement(Text, { style: styles.brandName }, "TROUT LAKE RESORT"),
          React.createElement(Text, { style: styles.logoText }, "Sainte-Agathe-des-Monts • Canada")
        ),
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(View, { style: { flex: 1 } }),
          React.createElement(
            View,
            { style: styles.invoiceMeta },
            React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
            React.createElement(Text, { style: styles.invoiceNumber }, `#${invoiceNumber}`),
            React.createElement(
              Text,
              { style: styles.invoiceDate },
              `Issue Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.billingSection },
          React.createElement(
            View,
            { style: styles.billingBox },
            React.createElement(Text, { style: styles.billingTitle }, "Bill To"),
            React.createElement(Text, { style: styles.billingName }, clientName)
          ),
          React.createElement(
            View,
            { style: styles.billingBox },
            React.createElement(Text, { style: styles.billingTitle }, "Event Information"),
            React.createElement(Text, { style: styles.billingName }, `${numberOfGuests} Guests`),
            React.createElement(
              Text,
              { style: styles.billingDetail },
              new Date(eventDateStart).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            ),
            React.createElement(Text, { style: { fontSize: 9, color: "#64748b", marginVertical: 2 } }, "through"),
            React.createElement(
              Text,
              { style: styles.billingDetail },
              new Date(eventDateEnd).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.table },
          React.createElement(
            View,
            { style: styles.tableHeader },
            React.createElement(Text, { style: [styles.tableHeaderText, { flex: 7 }] }, "Description"),
            React.createElement(Text, { style: [styles.tableHeaderText, { flex: 3, textAlign: "right" }] }, "Amount")
          ),
          React.createElement(
            View,
            { style: styles.tableRow },
            React.createElement(
              View,
              { style: { flex: 7 } },
              React.createElement(Text, { style: styles.itemTitle }, "Event Venue Rental"),
              React.createElement(Text, { style: styles.itemSubtitle }, `${numberOfGuests} guests`),
              React.createElement(
                Text,
                { style: styles.itemSubtitle },
                `${new Date(eventDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(eventDateEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              )
            ),
            React.createElement(
              View,
              { style: { flex: 3, alignItems: "flex-end" } },
              React.createElement(
                Text,
                { style: styles.amountText },
                `$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.totalsSection },
          React.createElement(
            View,
            { style: styles.totalRow },
            React.createElement(Text, { style: { color: "#64748b" } }, "Subtotal"),
            React.createElement(
              Text,
              { style: { fontFamily: "Helvetica-Bold" } },
              `$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )
          ),
          hasPayments &&
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(Text, { style: { color: "#059669", fontFamily: "Helvetica-Bold" } }, "Amount Paid"),
              React.createElement(
                Text,
                { style: { color: "#059669", fontFamily: "Helvetica-Bold" } },
                `-$${Number(depositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )
            ),
          hasPayments &&
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(Text, { style: { color: "#ea580c", fontFamily: "Helvetica-Bold" } }, "Balance Due"),
              React.createElement(
                Text,
                { style: { color: "#ea580c", fontFamily: "Helvetica-Bold" } },
                `$${Number(actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )
            ),
          React.createElement(
            View,
            { style: styles.grandTotal },
            React.createElement(Text, { style: styles.grandTotalText }, "Total Amount"),
            React.createElement(
              Text,
              { style: styles.grandTotalText },
              `$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.paymentInstructions },
          React.createElement(Text, { style: styles.paymentTitle }, "Payment Instructions"),
          React.createElement(Text, { style: styles.paymentText }, "Checks: Please make checks payable to Cong Zera Kodesh"),
          React.createElement(Text, { style: styles.paymentText }, "E-Transfer: Send to billing@troutlakeresort.ca")
        ),
        hasPayments && actualBalanceDue > 0 &&
          React.createElement(
            View,
            { style: [styles.statusBox, { backgroundColor: "#fef3c7", borderLeft: "4 solid #f59e0b" }] },
            React.createElement(Text, { style: [styles.statusTitle, { color: "#92400e" }] }, "⚠ Payment Required"),
            React.createElement(
              Text,
              { style: [styles.statusText, { color: "#78350f" }] },
              `A balance of $${Number(actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remains outstanding. Please remit payment by the agreed due date to maintain your reservation.`
            )
          ),
        hasPayments && actualBalanceDue <= 0 &&
          React.createElement(
            View,
            { style: [styles.statusBox, { backgroundColor: "#d1fae5", borderLeft: "4 solid #059669" }] },
            React.createElement(Text, { style: [styles.statusTitle, { color: "#065f46" }] }, "✓ Paid in Full"),
            React.createElement(
              Text,
              { style: [styles.statusText, { color: "#047857" }] },
              "Thank you! Your payment has been received and your reservation is confirmed."
            )
          ),
        !hasPayments &&
          React.createElement(
            View,
            { style: [styles.statusBox, { backgroundColor: "#fef3c7", borderLeft: "4 solid #f59e0b" }] },
            React.createElement(Text, { style: [styles.statusTitle, { color: "#92400e" }] }, "⚠ Payment Required"),
            React.createElement(
              Text,
              { style: [styles.statusText, { color: "#78350f" }] },
              `Full payment of $${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is required. Please remit payment by the agreed due date to maintain your reservation.`
            )
          ),
        notes &&
          React.createElement(
            View,
            { style: styles.notesBox },
            React.createElement(Text, { style: styles.notesTitle }, "Additional Notes"),
            React.createElement(Text, { style: styles.notesText }, notes)
          ),
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            Text,
            { style: [styles.footerText, { fontFamily: "Helvetica-Bold", color: "#1e293b" }] },
            "Thank you for choosing Trout Lake Resort!"
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "For questions regarding this invoice, please contact our billing office at billing@troutlakeresort.ca"
          ),
          React.createElement(
            Text,
            { style: [styles.footerText, { fontSize: 9, marginTop: 10 }] },
            "This is a computer-generated invoice."
          )
        )
      )
    );

    const pdfBuffer = await renderToBuffer(InvoicePDF);
    console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");

    console.log("Attempting to send email with PDF attachment...");
    const info = await transporter.sendMail({
      from: `"Trout Lake Resort - Billing" <${FROM_EMAIL}>`,
      to: to,
      subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    console.log("Email sent successfully with PDF attachment:", info.messageId);

    // ✅ LOG EMAIL TO DATABASE
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from("email_logs").insert({
        booking_id: bookingId || null,
        email_type: "invoice",
        recipient_email: to,
        recipient_name: clientName,
        subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
        status: "sent",
        metadata: {
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          balance_due: balanceDue,
          email_id: info.messageId
        }
      });

      console.log("✅ Email logged to database");
    } catch (logError) {
      console.error("⚠️ Failed to log email to database:", logError);
      // Don't fail the request if logging fails
    }

    return res.status(200).json({
      success: true,
      message: "Invoice sent successfully with PDF attachment",
      emailId: info.messageId,
    });
  } catch (error: any) {
    console.error("Detailed error sending invoice email:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    let errorMessage = error.message || "Failed to send invoice email";
    
    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Please check your SMTP credentials.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Connection timed out. Please check your SMTP server settings.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Please verify SMTP host and port.";
    }
    
    // ✅ LOG FAILED EMAIL
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from("email_logs").insert({
        booking_id: bookingId || null,
        email_type: "invoice",
        recipient_email: to,
        recipient_name: clientName,
        subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
        status: "failed",
        error_message: errorMessage,
        metadata: {
          invoice_number: invoiceNumber,
          error_code: error.code
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log failed email:", logError);
    }

    return res.status(500).json({
      error: errorMessage,
      details: error.message,
    });
  }
}
