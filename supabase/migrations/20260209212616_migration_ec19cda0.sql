-- Step 5: Recreate all RLS policies and constraints
-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for full access (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON public.invoices
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.invoices
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.invoices
  FOR DELETE USING (true);

-- Add foreign key constraint to bookings table
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_booking_id_fkey 
  FOREIGN KEY (booking_id) 
  REFERENCES public.bookings(id) 
  ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Final schema notification
ANALYZE public.invoices;
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';