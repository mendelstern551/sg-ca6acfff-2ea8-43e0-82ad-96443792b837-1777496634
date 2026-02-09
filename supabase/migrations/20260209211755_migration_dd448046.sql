-- Step 1: Rename 'amount' to force PostgREST cache invalidation
ALTER TABLE public.invoices RENAME COLUMN amount TO amount_temp;

-- Step 2: Notify PostgREST of schema change
NOTIFY pgrst, 'reload schema';