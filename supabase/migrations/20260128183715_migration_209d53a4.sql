-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_emails;

-- Create a completely open policy (no authentication required)
CREATE POLICY "Enable all access for client_emails" 
ON client_emails
FOR ALL
USING (true)
WITH CHECK (true);