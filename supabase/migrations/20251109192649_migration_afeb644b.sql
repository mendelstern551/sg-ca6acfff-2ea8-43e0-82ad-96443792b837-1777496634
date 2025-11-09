-- Add missing columns to the issues table for better tracking
ALTER TABLE issues ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES room_cleaning_sessions(id) ON DELETE SET NULL;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS task_name TEXT;

-- Drop the old reported_by_id if it exists and use employee_id for consistency
ALTER TABLE issues DROP COLUMN IF EXISTS reported_by_id;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;