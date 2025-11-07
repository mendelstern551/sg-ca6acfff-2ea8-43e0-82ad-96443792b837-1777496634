-- This script performs a safe, multi-step migration to fix critical schema errors.

-- Step 1: Safely convert 'bookings.custom_price' from BOOLEAN to NUMERIC
ALTER TABLE public.bookings RENAME COLUMN custom_price TO custom_price_old_boolean;
ALTER TABLE public.bookings ADD COLUMN custom_price NUMERIC;
ALTER TABLE public.bookings DROP COLUMN custom_price_old_boolean;

-- Step 2: Add 'recurring' field to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurring JSONB;

-- Step 3: Add missing fields to 'reminders' table
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS recurring JSONB;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS recurring_interval TEXT;

-- Step 4: Add missing 'building_id' to 'issues' table and set up foreign key
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS building_id UUID;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'issues_building_id_fkey' AND conrelid = 'public.issues'::regclass
  ) THEN
    ALTER TABLE public.issues 
      ADD CONSTRAINT issues_building_id_fkey 
      FOREIGN KEY (building_id) 
      REFERENCES public.buildings(id) 
      ON DELETE SET NULL;
  END IF;
END;
$$;