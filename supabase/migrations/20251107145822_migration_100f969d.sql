-- Drop all existing policies on buildings table
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

-- Drop all existing policies on rooms table
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

-- Create fresh public read policy for buildings
CREATE POLICY "Public read access for buildings"
ON public.buildings
FOR SELECT
TO public
USING (true);

-- Create fresh public read policy for rooms
CREATE POLICY "Public read access for rooms"
ON public.rooms
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to manage buildings
CREATE POLICY "Authenticated users can manage buildings"
ON public.buildings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to manage rooms
CREATE POLICY "Authenticated users can manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);