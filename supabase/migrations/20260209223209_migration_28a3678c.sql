-- Remove OLD conflicting RLS policies that use uid() instead of auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can update reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can delete reminders" ON reminders;

-- Keep only the working policies that use auth.uid() and allow service_role
-- These policies already exist and are correct:
-- "Allow users and service role to insert reminders"
-- "Allow users and service role to update reminders"
-- "Allow users and service role to delete reminders"
-- "Allow users and service role to view reminders"

-- Verify policies are correct
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reminders'
ORDER BY policyname;