
import type { NextApiRequest, NextApiResponse } from "next";

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

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return res.status(500).json({
      error: "Email service not configured. Please contact support.",
    });
  }

  try {
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
      <p style="margin: 5px 0;">Or by e-transfer to <strong>thetroutlakeresort@gmail.com</strong></p>
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Trout Lake Resort <thetroutlakeresort@gmail.com>",
        to: [to],
        subject: `Invoice ${invoiceNumber} - Trout Lake Resort`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    return res.status(200).json({
      success: true,
      message: "Invoice sent successfully",
      emailId: data.id,
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return res.status(500).json({
      error: error.message || "Failed to send invoice email",
    });
  }
}
