-- Drop and recreate the invoices table with the correct schema
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  total_amount NUMERIC,
  deposit_amount NUMERIC DEFAULT 0,
  balance_due NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  notes TEXT,
  email_status TEXT DEFAULT 'not_sent',
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invoices" ON invoices FOR DELETE USING (true);

-- Create index on booking_id
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);