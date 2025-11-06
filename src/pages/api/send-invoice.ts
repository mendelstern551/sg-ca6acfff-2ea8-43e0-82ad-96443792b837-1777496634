import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import React from "react";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

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
  logo: {
    width: 200,
    marginBottom: 10
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

const InvoiceDocument = ({ data }: { data: any }) => {
  const spacer = () => React.createElement(View, { style: { flex: 1 } });
  
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.logoContainer },
        React.createElement(Image, {
          src: "https://3000-ca6acfff-2ea8-43e0-82ad-96443792b837.softgen.dev/ChatGPT_Image_Nov_5_2025_03_58_44_PM.png",
          style: styles.logo
        }),
        React.createElement(Text, { style: styles.logoText }, "Sainte-Agathe-des-Monts • Canada")
      ),
      React.createElement(
        View,
        { style: styles.header },
        spacer(),
        React.createElement(
          View,
          { style: styles.invoiceMeta },
          React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
          React.createElement(Text, { style: styles.invoiceNumber }, `#${data.invoiceNumber}`),
          React.createElement(Text, { style: styles.invoiceDate }, `Issue Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`)
        )
      ),
      React.createElement(
        View,
        { style: styles.billingSection },
        React.createElement(
          View,
          { style: styles.billingBox },
          React.createElement(Text, { style: styles.billingTitle }, "Bill To"),
          React.createElement(Text, { style: styles.billingName }, data.clientName)
        ),
        React.createElement(
          View,
          { style: styles.billingBox },
          React.createElement(Text, { style: styles.billingTitle }, "Event Information"),
          React.createElement(Text, { style: styles.billingName }, `${data.numberOfGuests} Guests`),
          React.createElement(Text, { style: styles.billingDetail }, new Date(data.eventDateStart).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })),
          React.createElement(Text, { style: { fontSize: 9, color: "#64748b", marginVertical: 2 } }, "through"),
          React.createElement(Text, { style: styles.billingDetail }, new Date(data.eventDateEnd).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
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
            React.createElement(Text, { style: styles.itemSubtitle }, `${data.numberOfGuests} guests`),
            React.createElement(Text, { style: styles.itemSubtitle }, `${new Date(data.eventDateStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(data.eventDateEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`)
          ),
          React.createElement(
            View,
            { style: { flex: 3, alignItems: "flex-end" } },
            React.createElement(Text, { style: styles.amountText }, `$${Number(data.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
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
          React.createElement(Text, { style: { fontFamily: "Helvetica-Bold" } }, `$${Number(data.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        ),
        data.hasPayments && React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: { color: "#059669", fontFamily: "Helvetica-Bold" } }, "Amount Paid"),
          React.createElement(Text, { style: { color: "#059669", fontFamily: "Helvetica-Bold" } }, `-$${Number(data.depositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        ),
        data.hasPayments && React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: { color: "#ea580c", fontFamily: "Helvetica-Bold" } }, "Balance Due"),
          React.createElement(Text, { style: { color: "#ea580c", fontFamily: "Helvetica-Bold" } }, `$${Number(data.actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        ),
        React.createElement(
          View,
          { style: styles.grandTotal },
          React.createElement(Text, { style: styles.grandTotalText }, "Total Amount"),
          React.createElement(Text, { style: styles.grandTotalText }, `$${Number(data.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
        )
      ),
      React.createElement(
        View,
        { style: styles.paymentInstructions },
        React.createElement(Text, { style: styles.paymentTitle }, "Payment Instructions"),
        React.createElement(Text, { style: styles.paymentText }, "Checks: Please make checks payable to Cong Zera Kodesh"),
        React.createElement(Text, { style: styles.paymentText }, "E-Transfer: Send to billing@troutlakeresort.ca")
      ),
      data.hasPayments && data.actualBalanceDue > 0 && React.createElement(
        View,
        { style: [styles.statusBox, { backgroundColor: "#fef3c7", borderLeft: "4 solid #f59e0b" }] },
        React.createElement(Text, { style: [styles.statusTitle, { color: "#92400e" }] }, "⚠ Payment Required"),
        React.createElement(Text, { style: [styles.statusText, { color: "#78350f" }] }, `A balance of $${Number(data.actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remains outstanding. Please remit payment by the agreed due date to maintain your reservation.`)
      ),
      data.hasPayments && data.actualBalanceDue <= 0 && React.createElement(
        View,
        { style: [styles.statusBox, { backgroundColor: "#d1fae5", borderLeft: "4 solid #059669" }] },
        React.createElement(Text, { style: [styles.statusTitle, { color: "#065f46" }] }, "✓ Paid in Full"),
        React.createElement(Text, { style: [styles.statusText, { color: "#047857" }] }, "Thank you! Your payment has been received and your reservation is confirmed.")
      ),
      !data.hasPayments && React.createElement(
        View,
        { style: [styles.statusBox, { backgroundColor: "#fef3c7", borderLeft: "4 solid #f59e0b" }] },
        React.createElement(Text, { style: [styles.statusTitle, { color: "#92400e" }] }, "⚠ Payment Required"),
        React.createElement(Text, { style: [styles.statusText, { color: "#78350f" }] }, `Full payment of $${Number(data.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is required. Please remit payment by the agreed due date to maintain your reservation.`)
      ),
      data.notes && React.createElement(
        View,
        { style: styles.notesBox },
        React.createElement(Text, { style: styles.notesTitle }, "Additional Notes"),
        React.createElement(Text, { style: styles.notesText }, data.notes)
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: [styles.footerText, { fontFamily: "Helvetica-Bold", color: "#1e293b" }] }, "Thank you for choosing Trout Lake Resort!"),
        React.createElement(Text, { style: styles.footerText }, "For questions regarding this invoice, please contact our billing office at billing@troutlakeresort.ca"),
        React.createElement(Text, { style: [styles.footerText, { fontSize: 9, marginTop: 10 }] }, "This is a computer-generated invoice.")
      )
    )
  );
};

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
    eventDateStart,
    eventDateEnd,
    numberOfGuests,
    totalAmount,
    balanceDue,
    depositAmount,
    notes,
  } = req.body;

  if (!to || !clientName || !invoiceNumber) {
    return res.status(400).json({ error: "Missing required fields" });
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

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .invoice-box { border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #0ea5e9; margin-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; }
    .total-row { font-size: 18px; font-weight: bold; color: #0ea5e9; margin-top: 15px; padding-top: 15px; border-top: 2px solid #0ea5e9; }
    .payment-instructions { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #0f766e;">Trout Lake Resort</h1>
      <p>Sainte-Agathe-des-Monts • Canada</p>
    </div>
    <div class="invoice-box">
      <div class="invoice-number">Invoice ${invoiceNumber}</div>
      <p>Dear ${clientName},</p>
      <p>Thank you for choosing Trout Lake Resort! Please find your invoice attached as a PDF.</p>
      <div class="detail-row">
        <span class="detail-label">Event Dates:</span>
        <span>${new Date(eventDateStart).toLocaleDateString()} - ${new Date(eventDateEnd).toLocaleDateString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Number of Guests:</span>
        <span>${numberOfGuests}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Subtotal:</span>
        <span>$${Number(totalAmount).toFixed(2)}</span>
      </div>
      ${hasPayments ? `
      <div class="detail-row">
        <span class="detail-label">Amount Paid:</span>
        <span style="color: #16a34a;">-$${Number(depositAmount).toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="detail-row total-row">
        <span>Balance Due:</span>
        <span>$${Number(actualBalanceDue).toFixed(2)}</span>
      </div>
      <div class="detail-row total-row" style="border: none;">
        <span>Total Amount:</span>
        <span>$${Number(totalAmount).toFixed(2)}</span>
      </div>
    </div>
    <div class="payment-instructions">
      <h3 style="margin-top: 0;">Payment Instructions</h3>
      <p style="margin: 5px 0;">Checks should be made payable to <strong>Cong Zera Kodesh</strong></p>
      <p style="margin: 5px 0;">Or by e-transfer to <strong>billing@troutlakeresort.ca</strong></p>
    </div>
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    <div class="footer">
      <p>If you have any questions, please contact us at billing@troutlakeresort.ca</p>
      <p style="margin-top: 20px; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log("Generating PDF invoice...");
    const pdfData = {
      invoiceNumber,
      clientName,
      eventDateStart,
      eventDateEnd,
      numberOfGuests,
      totalAmount,
      depositAmount,
      hasPayments,
      actualBalanceDue,
      notes
    };

    const pdfBuffer = await ReactPDF.renderToBuffer(
      React.createElement(InvoiceDocument, { data: pdfData })
    );
    
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
    
    return res.status(500).json({
      error: errorMessage,
      details: error.message,
    });
  }
}
