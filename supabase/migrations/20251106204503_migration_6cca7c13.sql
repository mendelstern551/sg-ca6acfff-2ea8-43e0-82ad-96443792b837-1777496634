-- Add email tracking fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_to TEXT,
ADD COLUMN IF NOT EXISTS email_status TEXT CHECK (email_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create payment_reminders table for tracking reminder history
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_day', '7_day', 'payment_received', 'custom')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')) DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_reminders
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_reminders
CREATE POLICY "Allow all operations on payment_reminders" ON payment_reminders
  FOR ALL USING (true) WITH CHECK (true);

-- Add index for faster reminder queries
CREATE INDEX IF NOT EXISTS idx_payment_reminders_booking_id ON payment_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON payment_reminders(sent_at);