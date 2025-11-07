-- Grant public read access to buildings table
DO $$
BEGIN
    -- Drop conflicting policies if they exist
    DROP POLICY IF EXISTS "Public can view buildings" ON public.buildings;
    DROP POLICY IF EXISTS "Authenticated users can manage buildings" ON public.buildings;
    
    -- Create fresh public read policy
    CREATE POLICY "Allow public read access to buildings"
    ON public.buildings
    FOR SELECT
    USING (true);
    
    -- Allow authenticated users to manage buildings
    CREATE POLICY "Allow authenticated users to manage buildings"
    ON public.buildings
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
END
$$;

-- Grant public read access to rooms table
DO $$
BEGIN
    -- Drop conflicting policies if they exist
    DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;
    DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;
    
    -- Create fresh public read policy
    CREATE POLICY "Allow public read access to rooms"
    ON public.rooms
    FOR SELECT
    USING (true);
    
    -- Allow authenticated users to manage rooms
    CREATE POLICY "Allow authenticated users to manage rooms"
    ON public.rooms
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
END
$$;