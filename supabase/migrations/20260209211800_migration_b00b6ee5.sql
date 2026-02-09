-- Step 3: Rename it back to 'amount'
ALTER TABLE public.invoices RENAME COLUMN amount_temp TO amount;

-- Step 4: Final cache reload
ANALYZE public.invoices;
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';