import { supabase } from "@/integrations/supabase/client";
import type { EmailTemplate, ClientEmail, EmailSendRequest, EmailTemplateType } from "@/types/communication";

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "parking_regulations",
    type: "parking_regulations",
    name: "Parking & City Regulations",
    subject: "Important: Parking & City Regulations for Your Stay",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 25px; line-height: 1.6; }
    .section { margin-bottom: 30px; background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; }
    .section-title { color: #1e40af; font-size: 20px; font-weight: 700; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px; }
    .icon { font-size: 24px; }
    .section-content { color: #4b5563; font-size: 15px; line-height: 1.8; }
    .section-content strong { color: #1f2937; font-weight: 600; }
    .highlight-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px; }
    .highlight-box p { margin: 0; color: #991b1b; font-weight: 600; font-size: 15px; }
    .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 6px; }
    .info-box p { margin: 0; color: #1e40af; font-size: 15px; }
    .checklist { margin: 15px 0; padding-left: 0; list-style: none; }
    .checklist li { padding: 8px 0 8px 30px; position: relative; color: #4b5563; font-size: 15px; line-height: 1.6; }
    .checklist li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px; }
    .warning-list { margin: 15px 0; padding-left: 0; list-style: none; }
    .warning-list li { padding: 8px 0 8px 30px; position: relative; color: #991b1b; font-size: 15px; line-height: 1.6; }
    .warning-list li:before { content: "⚠"; position: absolute; left: 0; font-size: 18px; }
    .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; }
    .footer-brand { color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 30px 20px; }
      .section { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ Trout Lake Resort</h1>
      <p>Important City Regulations for Your Stay</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>{{client_name}}</strong>,<br><br>
        We're looking forward to welcoming you to Trout Lake Resort! To ensure a smooth and pleasant stay, please review these important city regulations for our area.
      </div>

      <div class="section">
        <div class="section-title">
          <span class="icon">🚗</span>
          <span>Street Parking Guidelines</span>
        </div>
        <div class="section-content">
          <p><strong>Daytime Parking:</strong> Street parking is permitted during daytime hours unless otherwise posted.</p>
          
          <div class="highlight-box">
            <p>❌ Overnight street parking is STRICTLY PROHIBITED on public roads</p>
          </div>

          <p><strong>🌙 Prohibited Hours:</strong> Midnight to 7:00 AM<br>
          <strong>📅 Winter Period:</strong> November 15 to April 15</p>

          <div class="info-box">
            <p><strong>🅿️ Good News:</strong> Municipal overnight parking areas are available during the winter season!</p>
          </div>

          <p style="margin-top: 15px;"><strong>⚠️ Always follow posted signs</strong> — signage overrides general rules.</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="icon">❄️</span>
          <span>Winter Enforcement</span>
        </div>
        <div class="section-content">
          <p>Winter parking regulations are <strong>strictly enforced</strong> to allow snow removal and emergency access.</p>
          <div class="highlight-box">
            <p>Vehicles parked illegally overnight may be ticketed or towed.</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="icon">↔️</span>
          <span>Direction of Parking — VERY IMPORTANT</span>
        </div>
        <div class="section-content">
          <div class="highlight-box">
            <p><strong>Vehicles MUST be parked in the correct direction of traffic.</strong></p>
          </div>
          <p>Parking against traffic, even briefly, may result in immediate ticketing.</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="icon">🏡</span>
          <span>Respect the Neighborhood</span>
        </div>
        <div class="section-content">
          <p>To ensure a peaceful experience for everyone:</p>
          <ul class="checklist">
            <li>Keep the grounds clean</li>
            <li>Be quiet outdoors during evenings and early mornings</li>
            <li>Do not block traffic at any time</li>
            <li>Respect neighboring properties</li>
            <li>Do not block entrances, mailboxes, or snow removal access</li>
          </ul>
          <ul class="warning-list">
            <li><strong>DO NOT park in neighboring driveways</strong></li>
          </ul>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
        <p style="color: #1f2937; font-size: 16px; margin: 0;">Thank you for your cooperation! 🙏</p>
        <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">We look forward to hosting you at Trout Lake Resort</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Trout Lake Resort</div>
      <p>📍 Rue des Mésanges, Sainte-Agathe-des-Monts</p>
    </div>
  </div>
</body>
</html>`,
    allowScheduling: true,
  },
  {
    id: "website_info",
    type: "website_info",
    name: "Website Information",
    subject: "Helpful Information for Your Stay at Trout Lake Resort",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 30px; line-height: 1.6; }
    .feature-grid { display: table; width: 100%; margin: 30px 0; }
    .feature { display: table-row; }
    .feature-icon { display: table-cell; width: 60px; vertical-align: top; padding: 15px 10px 15px 0; }
    .feature-icon-inner { background: linear-gradient(135deg, #059669 0%, #10b981 100%); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .feature-content { display: table-cell; vertical-align: top; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
    .feature:last-child .feature-content { border-bottom: none; }
    .feature-title { color: #059669; font-size: 18px; font-weight: 700; margin: 0 0 8px 0; }
    .feature-description { color: #6b7280; font-size: 15px; margin: 0; line-height: 1.6; }
    .cta-section { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px solid #10b981; }
    .cta-title { color: #059669; font-size: 22px; font-weight: 700; margin: 0 0 15px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; margin-top: 15px; }
    .cta-url { color: #059669; font-size: 16px; font-weight: 600; margin: 10px 0 0 0; word-break: break-all; }
    .recommendation { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .recommendation p { margin: 0; color: #92400e; font-size: 15px; line-height: 1.6; }
    .recommendation strong { color: #78350f; }
    .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; }
    .footer-brand { color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 30px 20px; }
      .cta-section { padding: 20px; }
      .feature-icon { display: none; }
      .feature { display: block; }
      .feature-content { display: block; padding: 20px; background-color: #f9fafb; margin-bottom: 10px; border-radius: 8px; border-bottom: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ Trout Lake Resort</h1>
      <p>Your Stay Information Guide</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>{{client_name}}</strong>,<br><br>
        Welcome to Trout Lake Resort! We've prepared a comprehensive information page to help make your stay as comfortable and enjoyable as possible.
      </div>

      <div class="feature-grid">
        <div class="feature">
          <div class="feature-icon">
            <div class="feature-icon-inner">🌤️</div>
          </div>
          <div class="feature-content">
            <div class="feature-title">Local Weather Forecast</div>
            <div class="feature-description">Stay updated with real-time weather conditions and 7-day forecasts for the Sainte-Agathe-des-Monts area. Plan your outdoor activities with confidence!</div>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <div class="feature-icon-inner">🕯️</div>
          </div>
          <div class="feature-content">
            <div class="feature-title">Zmanim for the Area</div>
            <div class="feature-description">Access daily Zmanim (Jewish prayer times) specific to our location, helping you maintain your schedule during your stay.</div>
          </div>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <div class="feature-icon-inner">🗺️</div>
          </div>
          <div class="feature-content">
            <div class="feature-title">Nearby Attractions & Activities</div>
            <div class="feature-description">Discover local restaurants, hiking trails, shopping centers, and entertainment options. Everything you need to explore the beautiful Laurentians!</div>
          </div>
        </div>
      </div>

      <div class="cta-section">
        <div class="cta-title">📱 Visit Our Information Portal</div>
        <p style="color: #065f46; font-size: 15px; margin: 10px 0 20px 0;">Access all these resources and more on our website</p>
        <a href="https://troutlakeresort.ca" class="cta-button">Visit Website →</a>
        <p class="cta-url">🔗 https://troutlakeresort.ca</p>
      </div>

      <div class="recommendation">
        <p><strong>💡 Pro Tip:</strong> We recommend bookmarking the page and checking it <strong>before and during your stay</strong> to stay informed about weather changes, local events, and activity recommendations!</p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
        <p style="color: #1f2937; font-size: 16px; margin: 0;">We can't wait to welcome you! 🎉</p>
        <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">Have a wonderful stay at Trout Lake Resort</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Trout Lake Resort</div>
      <p>📍 Sainte-Agathe-des-Monts, Quebec</p>
    </div>
  </div>
</body>
</html>`,
    allowScheduling: true,
  },
  {
    id: "rental_agreement",
    type: "rental_agreement",
    name: "Rental Agreement",
    subject: "Your Rental Agreement - Trout Lake Resort",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #ede9fe; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 30px; line-height: 1.6; }
    .document-box { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #a78bfa; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
    .document-icon { font-size: 48px; margin-bottom: 15px; }
    .document-title { color: #6b21a8; font-size: 20px; font-weight: 700; margin: 0 0 10px 0; }
    .document-name { color: #7c3aed; font-size: 16px; font-weight: 600; margin: 0; padding: 10px; background-color: #ffffff; border-radius: 6px; word-break: break-word; }
    .instruction-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .instruction-box p { margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6; }
    .action-list { margin: 20px 0; padding-left: 0; list-style: none; }
    .action-list li { padding: 12px 0 12px 35px; position: relative; color: #4b5563; font-size: 15px; line-height: 1.6; }
    .action-list li:before { content: "✓"; position: absolute; left: 0; color: #7c3aed; font-weight: bold; font-size: 20px; }
    .contact-section { background-color: #f9fafb; border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center; }
    .contact-section p { color: #4b5563; font-size: 15px; margin: 0 0 10px 0; }
    .contact-section strong { color: #1f2937; font-size: 16px; }
    .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; }
    .footer-brand { color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 30px 20px; }
      .document-box { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ Trout Lake Resort</h1>
      <p>Official Rental Agreement</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>{{client_name}}</strong>,<br><br>
        Thank you for choosing Trout Lake Resort! Please find your official rental agreement attached to this email.
      </div>

      <div class="document-box">
        <div class="document-icon">📄</div>
        <div class="document-title">Attached Document</div>
        <div class="document-name">{{file_name}}</div>
      </div>

      <div class="instruction-box">
        <p><strong>📋 Please Review:</strong> Kindly read through the entire agreement carefully. This document outlines the terms and conditions of your rental, including check-in/check-out times, house rules, and payment details.</p>
      </div>

      <div style="margin: 30px 0;">
        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px;">Next Steps:</p>
        <ul class="action-list">
          <li>Download and save the attached PDF for your records</li>
          <li>Review all terms and conditions thoroughly</li>
          <li>Note important dates: check-in time, check-out time, and any deadlines</li>
          <li>Reach out if you have any questions or concerns</li>
          <li>Keep this agreement accessible during your stay</li>
        </ul>
      </div>

      <div class="contact-section">
        <p>📧 <strong>Questions?</strong></p>
        <p>If you have any questions about the agreement or your upcoming stay, please don't hesitate to contact us. We're here to help!</p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
        <p style="color: #1f2937; font-size: 16px; margin: 0;">Looking forward to your arrival! 🎊</p>
        <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">See you soon at Trout Lake Resort</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Trout Lake Resort</div>
      <p>📍 Sainte-Agathe-des-Monts, Quebec</p>
      <p style="margin-top: 10px;">📧 info@troutlakeresort.ca</p>
    </div>
  </div>
</body>
</html>`,
    allowScheduling: true,
    requiresAttachment: true,
  },
];

class ClientCommunicationService {
  async checkDuplicateEmail(bookingId: string, emailType: EmailTemplateType): Promise<boolean> {
    const { data, error } = await supabase
      .from("client_emails")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("email_type", emailType)
      .in("status", ["sent", "scheduled"]);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  async sendEmail(request: EmailSendRequest): Promise<ClientEmail> {
    const isDuplicate = await this.checkDuplicateEmail(request.booking_id, request.email_type);
    
    if (isDuplicate) {
      throw new Error(`An email of type "${request.email_type}" has already been sent or scheduled for this client.`);
    }

    const emailRecord = {
      booking_id: request.booking_id,
      client_name: request.client_name,
      client_email: request.client_email,
      email_type: request.email_type,
      subject: request.subject,
      body: request.body,
      attachment_url: request.attachment_url,
      attachment_name: request.attachment_name,
      status: request.scheduled_date ? "scheduled" : "sent",
      scheduled_date: request.scheduled_date,
      sent_date: request.scheduled_date ? undefined : new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("client_emails")
      .insert(emailRecord)
      .select()
      .single();

    if (error) throw error;

    if (!request.scheduled_date) {
      await this.sendEmailViaAPI(request);
    }

    return {
      ...data,
      email_type: data.email_type as EmailTemplateType,
      status: data.status as "sent" | "scheduled" | "failed"
    };
  }

  private async sendEmailViaAPI(request: EmailSendRequest): Promise<void> {
    const response = await fetch("/api/send-client-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async getClientEmails(bookingId: string): Promise<ClientEmail[]> {
    const { data, error } = await supabase
      .from("client_emails")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return (data || []).map(email => ({
      ...email,
      email_type: email.email_type as EmailTemplateType,
      status: email.status as "sent" | "scheduled" | "failed"
    }));
  }

  async getAllClientEmails(): Promise<ClientEmail[]> {
    const { data, error } = await supabase
      .from("client_emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return (data || []).map(email => ({
      ...email,
      email_type: email.email_type as EmailTemplateType,
      status: email.status as "sent" | "scheduled" | "failed"
    }));
  }

  async uploadAgreement(file: File, clientName: string, eventDate: string): Promise<{ url: string; name: string }> {
    const fileName = `${clientName}_Agreement_${eventDate}.pdf`;
    const filePath = `agreements/${fileName}`;

    const { data, error } = await supabase.storage
      .from("client-documents")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("client-documents")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      name: fileName,
    };
  }

  processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return processed;
  }
}

export const clientCommunicationService = new ClientCommunicationService();