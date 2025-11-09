-- Step 1: Add is_manager column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT FALSE;

-- Step 2: Add index for faster manager lookups
CREATE INDEX IF NOT EXISTS idx_employees_is_manager 
ON public.employees(is_manager) 
WHERE is_manager = true;