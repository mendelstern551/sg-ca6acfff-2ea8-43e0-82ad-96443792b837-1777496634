import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      client_email,
      subject,
      body,
      attachment_url,
      attachment_name,
    } = req.body;

    if (!client_email || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify SMTP credentials are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP credentials not configured");
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Create nodemailer transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Prepare email configuration
    const mailOptions: any = {
      from: `"Trout Lake Resort" <${process.env.SMTP_USER}>`,
      to: client_email,
      subject: subject,
      html: body,
    };

    // Add attachment if provided
    if (attachment_url && attachment_name) {
      mailOptions.attachments = [
        {
          filename: attachment_name,
          path: attachment_url,
        },
      ];
    }

    // Send email via SMTP
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);
    return res.status(200).json({ 
      success: true, 
      id: info.messageId,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ 
      error: "Failed to send email",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}