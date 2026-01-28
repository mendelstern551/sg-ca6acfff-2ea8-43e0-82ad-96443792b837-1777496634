import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

interface FeedbackRequestBody {
  bookingId: string;
  contactName: string;
  contactEmail: string;
  eventName: string;
  checkOutDate: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { bookingId, contactName, contactEmail, eventName, checkOutDate }: FeedbackRequestBody = req.body;

    if (!bookingId || !contactEmail || !eventName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const feedbackUrl = process.env.FEEDBACK_FORM_URL || "https://forms.gle/your-google-form-link";

    // Enhanced HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd Love Your Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header with gradient background -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                We'd Love Your Feedback! 🌟
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Hi${contactName ? ` ${contactName}` : ""},
              </p>

              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Thank you for choosing <strong style="color: #667eea;">Trout Lake Resort</strong> in Sainte-Agathe for your recent <strong>${eventName}</strong> stay.
              </p>

              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                We truly hope your experience was comfortable, enjoyable, and memorable! ✨
              </p>

              <!-- Highlighted section -->
              <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecf5 100%); border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; color: #2d3748; font-size: 16px; line-height: 1.6; font-weight: 600;">
                  Your feedback is very important to us — it helps us continue improving and ensures every group enjoys the best stay possible.
                </p>
              </div>

              <p style="margin: 0 0 25px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                📌 Please take a moment to share your thoughts using the link below:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                  📝 Share Your Feedback
                </a>
              </div>

              <!-- Reward callout -->
              <div style="background: linear-gradient(135deg, #fef5e7 0%, #fdebd0 100%); border: 2px dashed #f39c12; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px; color: #2d3748; font-size: 18px; font-weight: 700;">
                  🎁 Thank You Bonus!
                </p>
                <p style="margin: 0; color: #5d4037; font-size: 15px; line-height: 1.5;">
                  Once your review is submitted, you will receive a <strong style="color: #f39c12;">$50 bonus credit</strong> toward your next booking with us!
                </p>
              </div>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 15px; line-height: 1.6; text-align: center; font-style: italic;">
                If you can also share this link with anyone who joined your group, it would be greatly appreciated. 🙏
              </p>

              <p style="margin: 30px 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Thank you again for being part of the <strong style="color: #667eea;">Trout Lake Resort family</strong>. 💙
              </p>

              <p style="margin: 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                We look forward to welcoming you back soon!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 15px; color: #2d3748; font-size: 16px; font-weight: 600;">
                Warm regards,
              </p>
              <p style="margin: 0 0 20px; color: #667eea; font-size: 18px; font-weight: 700;">
                Trout Lake Resort
              </p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #cbd5e0;">
                <p style="margin: 0 0 8px; color: #4a5568; font-size: 14px;">
                  📞 <a href="tel:+18456000271" style="color: #667eea; text-decoration: none; font-weight: 600;">845-600-0271</a>
                </p>
                <p style="margin: 0 0 8px; color: #4a5568; font-size: 14px;">
                  📧 <a href="mailto:office@troutlakeresort.ca" style="color: #667eea; text-decoration: none; font-weight: 600;">office@troutlakeresort.ca</a>
                </p>
                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                  🌐 <a href="https://www.troutlakeresort.ca" style="color: #667eea; text-decoration: none; font-weight: 600;">www.troutlakeresort.ca</a>
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #718096; font-size: 12px; line-height: 1.5;">
                Sainte-Agathe, Quebec<br>
                Your Perfect Getaway Destination
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
We'd Love Your Feedback on Your Recent Stay at Trout Lake Resort

Hi${contactName ? ` ${contactName}` : ""},

Thank you again for choosing Trout Lake Resort in Sainte-Agathe for your recent ${eventName} stay.
We truly hope your experience was comfortable, enjoyable, and memorable.

Your feedback is very important to us — it helps us continue improving and ensures every group enjoys the best stay possible.

Please take a moment to share your thoughts using the link below:
${feedbackUrl}

As a thank-you, once your review is submitted, you will receive a $50 bonus credit toward your next booking with us.

If you can also share this link with anyone who joined your group, it would be greatly appreciated.

Thank you again for being part of the Trout Lake Resort family.
We look forward to welcoming you back soon!

Warm regards,
Trout Lake Resort
📞 845-600-0271
📧 office@troutlakeresort.ca
🌐 www.troutlakeresort.ca

Sainte-Agathe, Quebec
Your Perfect Getaway Destination
    `;

    // Send email
    await transporter.sendMail({
      from: `"Trout Lake Resort" <office@troutlakeresort.ca>`,
      to: contactEmail,
      subject: "We'd Love Your Feedback on Your Recent Stay at Trout Lake Resort 🌟",
      text: textContent,
      html: htmlContent,
    });

    // Log email in tracking system
    await supabase.from("email_logs").insert({
      booking_id: bookingId,
      email_type: "feedback_request",
      recipient_email: contactEmail,
      subject: "We'd Love Your Feedback on Your Recent Stay at Trout Lake Resort",
      sent_at: new Date().toISOString(),
      status: "sent",
    });

    return res.status(200).json({
      success: true,
      message: "Feedback request email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending feedback request:", error);
    return res.status(500).json({
      error: "Failed to send feedback request email",
      details: error?.message,
    });
  }
}