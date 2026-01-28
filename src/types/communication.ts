export type EmailTemplateType = "parking_regulations" | "website_info" | "rental_agreement" | "custom";

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  allowScheduling: boolean;
  requiresAttachment?: boolean;
}

export interface ClientEmail {
  id: string;
  booking_id: string;
  client_name: string;
  client_email: string;
  email_type: EmailTemplateType;
  subject: string;
  body: string;
  attachment_url?: string;
  attachment_name?: string;
  status: "scheduled" | "sent" | "failed";
  scheduled_date?: string;
  sent_date?: string;
  created_at: string;
}

export interface EmailSendRequest {
  booking_id: string;
  client_name: string;
  client_email: string;
  email_type: EmailTemplateType;
  subject: string;
  body: string;
  attachment_url?: string;
  attachment_name?: string;
  scheduled_date?: string;
}