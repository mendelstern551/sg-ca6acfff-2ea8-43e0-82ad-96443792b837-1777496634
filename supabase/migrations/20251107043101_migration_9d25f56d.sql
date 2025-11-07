-- Fix RLS policies to allow public read access to buildings and rooms
-- This resolves the "Failed to fetch" network errors

-- Buildings table: Allow public read, authenticated write
DROP POLICY IF EXISTS "Authenticated users can manage buildings" ON public.buildings;
DROP POLICY IF EXISTS "Public can view buildings" ON public.buildings;

CREATE POLICY "Public can read buildings"
ON public.buildings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can modify buildings"
ON public.buildings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Rooms table: Allow public read, authenticated write
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;

CREATE POLICY "Public can read rooms"
ON public.rooms
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can modify rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the policies are working by testing a simple query
SELECT 
  b.id,
  b.name,
  COUNT(r.id) as room_count
FROM buildings b
LEFT JOIN rooms r ON r.building_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;