-- Force PostgREST to re-introspect by making a trivial schema change
COMMENT ON COLUMN public.invoices.amount IS 'Invoice total amount';

-- Also add comments to other frequently-queried columns to prevent future cache issues
COMMENT ON COLUMN public.invoices.due_date IS 'Payment due date';
COMMENT ON COLUMN public.reminders.related_id IS 'Related entity ID (booking, invoice, etc)';

-- Force a schema version bump
ALTER TABLE public.invoices ALTER COLUMN amount SET DEFAULT 0;

-- Final cache reload
ANALYZE public.invoices;
NOTIFY pgrst, 'reload schema';