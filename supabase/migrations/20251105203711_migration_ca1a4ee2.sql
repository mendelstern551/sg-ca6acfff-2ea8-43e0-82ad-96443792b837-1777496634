-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- Create new permissive policies for internal management tool
CREATE POLICY "Anyone can view invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invoices" ON invoices FOR DELETE USING (true);