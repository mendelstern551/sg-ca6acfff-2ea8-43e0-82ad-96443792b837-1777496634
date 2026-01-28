import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      client_email,
      subject,
      body,
      attachment_url,
      attachment_name,
      email_type
    } = req.body;

    if (!client_email || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailConfig: any = {
      from: 'Trout Lake Resort <info@troutlakeresort.ca>',
      to: client_email,
      subject: subject,
      text: body, // Fallback
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`,
    };

    if (attachment_url && attachment_name) {
      emailConfig.attachments = [
        {
          filename: attachment_name,
          path: attachment_url,
        },
      ];
    }

    const data = await resend.emails.send(emailConfig);

    if (data.error) {
      console.error('Resend error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({ success: true, id: data.data?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}