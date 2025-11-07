-- Rename booking date columns to match the code's expectation
ALTER TABLE public.bookings RENAME COLUMN start_time TO start_date;
ALTER TABLE public.bookings RENAME COLUMN end_time TO end_date;

-- Add missing columns to other tables
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;