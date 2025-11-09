-- Step 1: Add monthly_salary column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10, 2) DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.employees.monthly_salary IS 'Fixed monthly salary for managers (if applicable). Used for salaried employees instead of hourly rate.';