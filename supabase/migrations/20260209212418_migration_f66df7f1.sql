-- Step 2: Create the new invoices table with exact same structure
CREATE TABLE public.invoices_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
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
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status constraint
ALTER TABLE public.invoices_new 
ADD CONSTRAINT invoices_new_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partially_paid'));

-- Add email_status constraint
ALTER TABLE public.invoices_new 
ADD CONSTRAINT invoices_new_email_status_check 
CHECK (email_status IN ('not_sent', 'sent', 'failed'));

-- Create indexes for performance
CREATE INDEX idx_invoices_new_booking_id ON public.invoices_new(booking_id);
CREATE INDEX idx_invoices_new_status ON public.invoices_new(status);
CREATE INDEX idx_invoices_new_due_date ON public.invoices_new(due_date);
CREATE UNIQUE INDEX idx_invoices_new_invoice_number ON public.invoices_new(invoice_number);

-- Force PostgREST to see the new table
ANALYZE public.invoices_new;
NOTIFY pgrst, 'reload schema';