-- Create email_tracking table for email history
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view email tracking" ON email_tracking FOR SELECT USING (true);
CREATE POLICY "Anyone can insert email tracking" ON email_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update email tracking" ON email_tracking FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete email tracking" ON email_tracking FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_tracking_booking_id ON email_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at DESC);