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
    bookingName,
    bookingType,
    startDate,
    endDate,
    numberOfGuests,
    totalCost,
    depositAmount,
    balanceDue,
    notes,
  } = req.body;

  if (!to || !clientName || !bookingName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_AUTH_USER;
  const SMTP_PASS = process.env.SMTP_AUTH_PASS;
  const FROM_EMAIL = process.env.BOOKING_FROM_EMAIL || "booking@troutlakeresort.ca";

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP configuration is incomplete");
    return res.status(500).json({
      error: "Email service not configured. Please contact support.",
    });
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const bookingTypeFormatted = bookingType.replace(/_/g, " ").toUpperCase();
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #0f766e, #0ea5e9); color: white; padding: 30px; border-radius: 8px; }
    .confirmation-box { border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f0fdf4; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .detail-label { font-weight: bold; }
    .total-row { font-size: 18px; font-weight: bold; color: #0ea5e9; margin-top: 15px; padding-top: 15px; border-top: 2px solid #0ea5e9; }
    .payment-instructions { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .checkmark { color: #16a34a; font-size: 48px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Trout Lake Resort</h1>
      <p style="margin: 10px 0 0 0;">Sainte-Agathe-des-Monts • Canada</p>
    </div>

    <div class="checkmark">✓</div>
    <h2 style="text-align: center; color: #16a34a;">Booking Confirmed!</h2>

    <div class="confirmation-box">
      <p>Dear ${clientName},</p>
      <p>We're excited to confirm your reservation at Trout Lake Resort!</p>

      <div class="detail-row">
        <span class="detail-label">Booking Name:</span>
        <span>${bookingName}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Booking Type:</span>
        <span>${bookingTypeFormatted}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Event Dates:</span>
        <span>${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Number of Guests:</span>
        <span>${numberOfGuests}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">Total Cost:</span>
        <span>$${Number(totalCost).toFixed(2)}</span>
      </div>

      ${depositAmount > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Deposit Amount:</span>
        <span style="color: #16a34a;">$${Number(depositAmount).toFixed(2)}</span>
      </div>
      ` : ''}

      ${balanceDue > 0 ? `
      <div class="detail-row total-row">
        <span>Balance Due:</span>
        <span>$${Number(balanceDue).toFixed(2)}</span>
      </div>
      ` : ''}
    </div>

    <div class="payment-instructions">
      <h3 style="margin-top: 0;">Payment Instructions</h3>
      <p style="margin: 5px 0;">Checks should be made payable to <strong>Cong Zera Kodesh</strong></p>
      <p style="margin: 5px 0;">Or by e-transfer to <strong>booking@troutlakeresort.ca</strong></p>
    </div>

    ${notes ? `
    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Special Notes:</strong></p>
      <p style="margin: 5px 0 0 0;">${notes}</p>
    </div>
    ` : ''}

    <p style="margin-top: 30px;">We look forward to hosting you at Trout Lake Resort! If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>

    <div class="footer">
      <p>Contact us at booking@troutlakeresort.ca</p>
      <p style="margin-top: 20px; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Trout Lake Resort - Bookings" <${FROM_EMAIL}>`,
      to: to,
      subject: `Booking Confirmed - ${bookingName} at Trout Lake Resort`,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Confirmation sent successfully",
      emailId: info.messageId,
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return res.status(500).json({
      error: error.message || "Failed to send confirmation email",
    });
  }
}
