-- Drop the old policy and create proper ones
DROP POLICY IF EXISTS "Enable all access for client_emails" ON client_emails;

-- Create policies for authenticated users (most common case)
CREATE POLICY "Authenticated users can view client emails" 
  ON client_emails FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert client emails" 
  ON client_emails FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update client emails" 
  ON client_emails FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete client emails" 
  ON client_emails FOR DELETE 
  USING (auth.uid() IS NOT NULL);