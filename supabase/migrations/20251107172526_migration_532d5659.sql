-- Migration to fix the employees table by adding missing columns
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pay_rate NUMERIC;