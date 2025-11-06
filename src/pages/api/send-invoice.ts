import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

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

  // Validate required fields
  if (!to || !clientName || !invoiceNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_AUTH_USER;
  const SMTP_PASS = process.env.SMTP_AUTH_PASS;
  const FROM_EMAIL = process.env.INVOICE_FROM_EMAIL || "billing@troutlakeresort.ca";

  // Log configuration (without password) for debugging
  console.log("Email Configuration:", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    from: FROM_EMAIL,
    to: to,
  });

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP configuration is incomplete:", {
      hasHost: !!SMTP_HOST,
      hasPort: !!SMTP_PORT,
      hasUser: !!SMTP_USER,
      hasPass: !!SMTP_PASS,
    });
    return res.status(500).json({
      error: "Email service not configured. Please contact support.",
    });
  }

  try {
    // Create transporter
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

    // Verify connection
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const hasPayments = depositAmount > 0;
    const actualBalanceDue = totalAmount - depositAmount;

    // Email body HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { max-width: 200px; margin-bottom: 20px; }
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
      <p>Thank you for choosing Trout Lake Resort! Please find your invoice details below:</p>

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

    // Complete invoice HTML for attachment
    const invoiceAttachmentHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; background: white; }
    .invoice { max-width: 850px; margin: 40px auto; background: white; padding: 60px; }
    
    .logo-container { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #0f766e; }
    .logo-text { font-size: 36px; font-weight: bold; color: #0f766e; margin-bottom: 10px; }
    
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 50px; }
    
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 36px; color: #1e293b; margin-bottom: 8px; font-weight: 300; letter-spacing: -1px; }
    .invoice-number { font-size: 18px; color: #0f766e; font-weight: 600; margin-bottom: 12px; }
    .invoice-date { font-size: 14px; color: #64748b; }
    
    .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
    .billing-box { background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 4px solid #0f766e; }
    .billing-box h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 15px; font-weight: 600; }
    .billing-box p { font-size: 15px; color: #1e293b; line-height: 1.8; margin: 4px 0; }
    .billing-box strong { display: block; font-size: 18px; color: #0f766e; margin-bottom: 8px; }
    
    .items-table { width: 100%; margin: 40px 0; border-collapse: collapse; }
    .items-table thead { background: #f1f5f9; }
    .items-table th { padding: 15px 20px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    .items-table td { padding: 18px 20px; color: #334155; font-size: 15px; border-bottom: 1px solid #f1f5f9; }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table .amount { text-align: right; font-weight: 600; font-size: 16px; }
    
    .totals { margin-top: 30px; padding-top: 30px; border-top: 2px solid #e2e8f0; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 16px; }
    .total-row.subtotal { color: #64748b; }
    .total-row.payment { color: #059669; font-weight: 600; }
    .total-row.balance { color: #ea580c; font-weight: 600; }
    .total-row.grand-total { background: #ecfdf5; border: 2px solid #0f766e; border-radius: 8px; margin-top: 15px; padding: 20px; font-size: 20px; font-weight: 700; color: #0f766e; }
    
    .payment-terms { margin-top: 50px; padding: 25px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
    .payment-terms h4 { color: #92400e; font-size: 14px; margin-bottom: 10px; font-weight: 600; }
    .payment-terms p { color: #78350f; font-size: 13px; line-height: 1.6; }
    
    .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { color: #64748b; font-size: 13px; line-height: 1.8; }
    .footer strong { color: #1e293b; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="logo-container">
      <div class="logo-text">TROUT LAKE RESORT</div>
      <p style="color: #64748b;">Sainte-Agathe-des-Monts • Canada</p>
    </div>

    <div class="header">
      <div style="flex: 1;"></div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <div class="invoice-number">#${invoiceNumber}</div>
        <div class="invoice-date">Issue Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>

    <div class="billing-section">
      <div class="billing-box">
        <h3>Bill To</h3>
        <strong>${clientName}</strong>
      </div>
      
      <div class="billing-box">
        <h3>Event Information</h3>
        <strong>${numberOfGuests} Guests</strong>
        <p>${new Date(eventDateStart).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p>through</p>
        <p>${new Date(eventDateEnd).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 70%">Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Event Venue Rental</strong><br>
            <span style="font-size: 13px; color: #64748b;">
              ${numberOfGuests} guests<br>
              ${new Date(eventDateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(eventDateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </td>
          <td class="amount">$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal</span>
        <span>$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      ${hasPayments ? `
      <div class="total-row payment">
        <span>Amount Paid</span>
        <span>-$${Number(depositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="total-row balance">
        <span>Balance Due</span>
        <span>$${Number(actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>Total Amount</span>
        <span>$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div style="margin-top: 40px; padding: 25px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
      <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 12px; font-weight: 600;">Payment Instructions</h4>
      <p style="color: #1e293b; font-size: 13px; line-height: 1.8; margin-bottom: 8px;">
        <strong>Checks:</strong> Please make checks payable to <strong>Cong Zera Kodesh</strong>
      </p>
      <p style="color: #1e293b; font-size: 13px; line-height: 1.8;">
        <strong>E-Transfer:</strong> Send to <strong>billing@troutlakeresort.ca</strong>
      </p>
    </div>

    ${hasPayments && actualBalanceDue > 0 ? `
    <div class="payment-terms">
      <h4>⚠ Payment Required</h4>
      <p>A balance of <strong>$${Number(actualBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> remains outstanding. Please remit payment by the agreed due date to maintain your reservation.</p>
    </div>
    ` : hasPayments && actualBalanceDue <= 0 ? `
    <div class="payment-terms" style="background: #d1fae5; border-left-color: #059669;">
      <h4 style="color: #065f46;">✓ Paid in Full</h4>
      <p style="color: #047857;">Thank you! Your payment has been received and your reservation is confirmed.</p>
    </div>
    ` : `
    <div class="payment-terms">
      <h4>⚠ Payment Required</h4>
      <p>Full payment of <strong>$${Number(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is required. Please remit payment by the agreed due date to maintain your reservation.</p>
    </div>
    `}

    ${notes ? `
    <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
      <h4 style="color: #475569; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Additional Notes</h4>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">${notes}</p>
    </div>
    ` : ""}

    <div class="footer">
      <p><strong>Thank you for choosing Trout Lake Resort!</strong></p>
      <p>For questions regarding this invoice, please contact our billing office at billing@troutlakeresort.ca</p>
      <p style="margin-top: 15px; font-size: 12px;">This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email with attachment
    console.log("Attempting to send email with attachment...");
    const info = await transporter.sendMail({
      from: `"Trout Lake Resort - Billing" <${FROM_EMAIL}>`,
      to: to,
      subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.html`,
          content: invoiceAttachmentHtml,
          contentType: "text/html"
        }
      ]
    });

    console.log("Email sent successfully with attachment:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "Invoice sent successfully with attachment",
      emailId: info.messageId,
    });
  } catch (error: any) {
    console.error("Detailed error sending invoice email:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });
    
    let errorMessage = error.message || "Failed to send invoice email";
    
    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Please check your SMTP credentials.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Connection timed out. Please check your SMTP server settings.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Please verify SMTP host and port.";
    } else if (error.responseCode === 550) {
      errorMessage = "Email rejected. The 'from' address may need to be verified in SMTP.com.";
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: error.message,
    });
  }
}
