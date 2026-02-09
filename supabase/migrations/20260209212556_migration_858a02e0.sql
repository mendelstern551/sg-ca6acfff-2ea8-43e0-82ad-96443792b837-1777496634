-- Step 4: Drop the old table and rename the new one
DROP TABLE IF EXISTS public.invoices CASCADE;

ALTER TABLE public.invoices_new RENAME TO invoices;

-- Recreate indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Force PostgREST to recognize the new table
ANALYZE public.invoices;
NOTIFY pgrst, 'reload schema';