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

    // Prepare attachments
    const attachmentsList = [];
    if (attachment_url && attachment_name) {
      attachmentsList.push({
        filename: attachment_name,
        path: attachment_url,
      });
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

    // Send email using Nodemailer
    const mailOptions = {
      from: `"Trout Lake Resort" <info@troutlakeresort.ca>`,
      to: client_email,
      subject: subject,
      html: body,
      attachments: attachmentsList,
    };

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