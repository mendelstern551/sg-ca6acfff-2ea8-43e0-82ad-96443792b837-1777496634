-- Drop restrictive policies and create public policies for reminders
DROP POLICY IF EXISTS "Allow users and service role to insert reminders" ON reminders;
DROP POLICY IF EXISTS "Allow users and service role to update reminders" ON reminders;
DROP POLICY IF EXISTS "Allow users and service role to delete reminders" ON reminders;

-- Create public policies (anyone can insert/update/delete)
CREATE POLICY "Public can insert reminders" ON reminders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update reminders" ON reminders
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete reminders" ON reminders
FOR DELETE
USING (true);