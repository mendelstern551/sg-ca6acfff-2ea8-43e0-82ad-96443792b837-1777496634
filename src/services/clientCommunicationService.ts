import { supabase } from "@/integrations/supabase/client";
import type { EmailTemplate, ClientEmail, EmailSendRequest, EmailTemplateType } from "@/types/communication";

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "parking_regulations",
    type: "parking_regulations",
    name: "Parking & City Regulations",
    subject: "Important: Parking & City Regulations for Your Stay",
    body: `Dear {{client_name}},

We're looking forward to welcoming you to Trout Lake Resort and would like to kindly share important city regulations for our area.

━━━━━━━━━━━━━━━━━━
🚨 Important City Regulations
Parking & Neighborhood Guidelines
📍 Rue des Mésanges – Sainte-Agathe-des-Monts
━━━━━━━━━━━━━━━━━━

🚗 Street Parking
Street parking is permitted during daytime hours unless otherwise posted.

❌ Overnight street parking is strictly prohibited on public roads:

🌙 Midnight to 7:00 AM  
📅 November 15 to April 15

These rules apply even when the street appears clear.

🅿️ Municipal overnight parking areas are available during the winter season.  
⚠️ Always follow posted signs — signage overrides general rules.

❄️ Winter Enforcement
Winter parking regulations are strictly enforced to allow snow removal and emergency access. Vehicles parked illegally overnight may be ticketed or towed.

↔️ Direction of Parking – VERY IMPORTANT
Vehicles must always be parked in the correct direction of traffic.
Parking against traffic, even briefly, may result in immediate ticketing.

🏡 Respect the Neighborhood
To ensure a peaceful experience for everyone:
• Please keep the grounds clean  
• Be quiet outdoors during evenings and early mornings  
• Do not block traffic at any time  
• Do NOT park in neighboring driveways  
• Do not block entrances, mailboxes, or snow removal access  

Thank you for your cooperation and for helping maintain a respectful and pleasant environment.

Warm regards,  
**Trout Lake Resort Team**`,
    allowScheduling: true,
  },
  {
    id: "website_info",
    type: "website_info",
    name: "Website Information",
    subject: "Helpful Information for Your Stay at Trout Lake Resort",
    body: `Dear {{client_name}},

For your convenience, we've prepared a helpful page on our website with important information for your stay.

🌤️ Local Weather  
🕯️ Zmanim for the area  
🗺️ Nearby attractions & activities  

Please visit:
👉 https://troutlakeresort.ca

We recommend checking it before and during your stay to help you plan comfortably.

Looking forward to hosting you,  
**Trout Lake Resort Team**`,
    allowScheduling: true,
  },
  {
    id: "rental_agreement",
    type: "rental_agreement",
    name: "Rental Agreement",
    subject: "Your Rental Agreement - Trout Lake Resort",
    body: `Dear {{client_name}},

Attached please find your rental agreement for your upcoming stay at Trout Lake Resort.

📄 Agreement: {{file_name}}

Kindly review the document carefully and keep it for your records.
If you have any questions, feel free to reach out.

We look forward to welcoming you.

Warm regards,  
**Trout Lake Resort Team**`,
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

    // Cast the string email_type from DB to EmailTemplateType enum
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