-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON bookings;

-- Create a permissive INSERT policy that allows anyone
CREATE POLICY "Anyone can insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Also update UPDATE policy to be more permissive
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;

CREATE POLICY "Anyone can update bookings" ON bookings
  FOR UPDATE
  USING (true);

-- Update DELETE policy to be more permissive
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;

CREATE POLICY "Anyone can delete bookings" ON bookings
  FOR DELETE
  USING (true);