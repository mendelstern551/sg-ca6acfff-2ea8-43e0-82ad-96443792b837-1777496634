-- Create invoices table to store all generated invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date_start TIMESTAMP WITH TIME ZONE NOT NULL,
  event_date_end TIMESTAMP WITH TIME ZONE NOT NULL,
  number_of_guests INTEGER NOT NULL,
  number_of_rooms INTEGER NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  balance_due DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view all invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete invoices" ON invoices FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);