-- Add compensation_id column to manager_payments table
ALTER TABLE manager_payments
ADD COLUMN IF NOT EXISTS compensation_id UUID REFERENCES manager_compensation(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_manager_payments_compensation_id ON manager_payments(compensation_id);

-- Fix RLS policies for reminders table to allow service role
DROP POLICY IF EXISTS "Allow authenticated users to view reminders" ON reminders;
DROP POLICY IF EXISTS "Allow authenticated users to insert reminders" ON reminders;
DROP POLICY IF EXISTS "Allow authenticated users to update reminders" ON reminders;
DROP POLICY IF EXISTS "Allow authenticated users to delete reminders" ON reminders;

-- Create new RLS policies that allow both authenticated users and service role
CREATE POLICY "Allow users and service role to view reminders" ON reminders
FOR SELECT
USING (
  auth.uid() IS NOT NULL OR 
  auth.role() = 'service_role'
);

CREATE POLICY "Allow users and service role to insert reminders" ON reminders
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL OR 
  auth.role() = 'service_role'
);

CREATE POLICY "Allow users and service role to update reminders" ON reminders
FOR UPDATE
USING (
  auth.uid() IS NOT NULL OR 
  auth.role() = 'service_role'
);

CREATE POLICY "Allow users and service role to delete reminders" ON reminders
FOR DELETE
USING (
  auth.uid() IS NOT NULL OR 
  auth.role() = 'service_role'
);