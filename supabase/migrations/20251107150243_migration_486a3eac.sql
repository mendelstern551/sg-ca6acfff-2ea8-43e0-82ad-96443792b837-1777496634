-- NUCLEAR OPTION: Complete RLS reset for buildings and rooms

-- Step 1: Drop ALL policies on buildings
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

-- Step 2: Drop ALL policies on rooms
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

-- Step 3: Disable RLS temporarily
ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Step 4: Re-enable RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Step 5: Create single, simple SELECT policy for buildings (no role restriction)
CREATE POLICY "allow_all_select_buildings"
ON public.buildings
FOR SELECT
USING (true);

-- Step 6: Create single, simple SELECT policy for rooms (no role restriction)
CREATE POLICY "allow_all_select_rooms"
ON public.rooms
FOR SELECT
USING (true);

-- Step 7: Create write policies for authenticated users only
CREATE POLICY "allow_authenticated_insert_buildings"
ON public.buildings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update_buildings"
ON public.buildings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete_buildings"
ON public.buildings
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_rooms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update_rooms"
ON public.rooms
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete_rooms"
ON public.rooms
FOR DELETE
TO authenticated
USING (true);