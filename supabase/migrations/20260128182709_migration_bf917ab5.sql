-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON client_emails;
DROP POLICY IF EXISTS "Enable insert access for all users" ON client_emails;
DROP POLICY IF EXISTS "Enable update access for all users" ON client_emails;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON client_emails
  FOR ALL
  USING (true)
  WITH CHECK (true);