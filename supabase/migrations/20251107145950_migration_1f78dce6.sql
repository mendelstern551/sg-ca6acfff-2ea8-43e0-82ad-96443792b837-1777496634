-- Drop ALL existing policies on buildings table
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.buildings', pol.policyname);
    END LOOP;
END
$$;

-- Drop ALL existing policies on rooms table
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.rooms', pol.policyname);
    END LOOP;
END
$$;

-- Create simple, permissive public read policies
CREATE POLICY "enable_read_access_for_all_users"
ON public.buildings
FOR SELECT
TO public
USING (true);

CREATE POLICY "enable_read_access_for_all_users"
ON public.rooms
FOR SELECT
TO public
USING (true);

-- Allow authenticated users full access
CREATE POLICY "enable_all_access_for_authenticated_users"
ON public.buildings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_all_access_for_authenticated_users"
ON public.rooms
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);