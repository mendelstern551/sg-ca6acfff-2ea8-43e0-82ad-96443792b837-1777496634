-- COMPLETE RLS RESET: Drop all policies and start fresh

-- Step 1: Disable RLS on both tables
ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on buildings
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

-- Step 3: Drop ALL existing policies on rooms
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

-- Step 4: Re-enable RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple public read policies (no role restrictions)
CREATE POLICY "public_read_buildings"
  ON public.buildings
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

CREATE POLICY "public_read_rooms"
  ON public.rooms
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

-- Step 6: Create write policies for authenticated users
CREATE POLICY "authenticated_write_buildings"
  ON public.buildings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_write_rooms"
  ON public.rooms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.buildings TO anon;
GRANT SELECT ON public.rooms TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.buildings TO authenticated;
GRANT ALL ON public.rooms TO authenticated;