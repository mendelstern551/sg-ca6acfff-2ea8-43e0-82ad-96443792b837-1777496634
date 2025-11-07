-- Step 1: Rename the problematic boolean 'custom_price' column to avoid data loss.
ALTER TABLE public.bookings RENAME COLUMN custom_price TO custom_price_old_boolean;

-- Step 2: Add a new 'custom_price' column with the correct NUMERIC type.
ALTER TABLE public.bookings ADD COLUMN custom_price NUMERIC;

-- Step 3: Remove the old, incorrectly typed column.
ALTER TABLE public.bookings DROP COLUMN custom_price_old_boolean;

-- Add other missing columns that are causing errors.
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS recurring JSONB;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS building_id UUID;

-- Recreate the foreign key constraint for 'issues.building_id' if it doesn't exist.
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