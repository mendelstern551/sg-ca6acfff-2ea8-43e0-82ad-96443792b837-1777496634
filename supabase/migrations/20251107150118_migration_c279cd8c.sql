-- COMPLETE RLS RESET FOR BUILDINGS AND ROOMS TABLES

-- Step 1: Disable RLS temporarily to ensure clean slate
ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on buildings table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'buildings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.buildings CASCADE', pol.policyname);
    END LOOP;
END
$$;

-- Step 3: Drop ALL existing policies on rooms table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'rooms'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rooms CASCADE', pol.policyname);
    END LOOP;
END
$$;

-- Step 4: Verify foreign key constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'rooms'
        AND constraint_name LIKE '%building_id%'
    ) THEN
        ALTER TABLE public.rooms 
        ADD CONSTRAINT rooms_building_id_fkey 
        FOREIGN KEY (building_id) 
        REFERENCES public.buildings(id) 
        ON DELETE CASCADE;
    END IF;
END
$$;

-- Step 5: Re-enable RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Step 6: Create ULTRA-PERMISSIVE policies for buildings (allow everything for everyone)
CREATE POLICY "buildings_select_all"
  ON public.buildings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "buildings_insert_all"
  ON public.buildings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "buildings_update_all"
  ON public.buildings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "buildings_delete_all"
  ON public.buildings
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Step 7: Create ULTRA-PERMISSIVE policies for rooms (allow everything for everyone)
CREATE POLICY "rooms_select_all"
  ON public.rooms
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "rooms_insert_all"
  ON public.rooms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "rooms_update_all"
  ON public.rooms
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "rooms_delete_all"
  ON public.rooms
  FOR DELETE
  TO anon, authenticated
  USING (true);