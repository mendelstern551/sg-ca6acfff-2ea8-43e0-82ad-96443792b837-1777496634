-- Add a policy to allow service role to insert email logs
CREATE POLICY "Allow service role to manage email logs"
ON email_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);