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
      debug: true, // Enable debug output
      logger: true, // Log information to console
    });

    // Verify connection
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");

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

      ${depositAmount > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Amount Paid:</span>
        <span style="color: #16a34a;">-$${Number(depositAmount).toFixed(2)}</span>
      </div>
      ` : ''}

      <div class="detail-row total-row">
        <span>Balance Due:</span>
        <span>$${Number(balanceDue).toFixed(2)}</span>
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
      <p>If you have any questions, please contact us at thetroutlakeresort@gmail.com</p>
      <p style="margin-top: 20px; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    console.log("Attempting to send email...");
    const info = await transporter.sendMail({
      from: `"Trout Lake Resort - Billing" <${FROM_EMAIL}>`,
      to: to,
      subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "Invoice sent successfully",
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
    
    // Provide more specific error messages
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
