CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'failed')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  sent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON client_emails FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON client_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON client_emails FOR UPDATE USING (true);