-- Create client_emails table for tracking all client communications
CREATE TABLE IF NOT EXISTS public.client_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  attachment_name TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by booking_id
CREATE INDEX IF NOT EXISTS idx_client_emails_booking_id ON public.client_emails(booking_id);

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_client_emails_status ON public.client_emails(status);

-- Create index for filtering by email_type
CREATE INDEX IF NOT EXISTS idx_client_emails_email_type ON public.client_emails(email_type);

-- Enable RLS
ALTER TABLE public.client_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read, authenticated users can insert/update)
CREATE POLICY "public_read" ON public.client_emails FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON public.client_emails FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update" ON public.client_emails FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete" ON public.client_emails FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON TABLE public.client_emails IS 'Stores all client email communications including scheduled and sent emails with attachments';