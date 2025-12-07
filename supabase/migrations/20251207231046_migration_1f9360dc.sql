-- Add booking_id to reminders if it doesn't exist
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Add time_entry_id to task_logs if it doesn't exist
ALTER TABLE task_logs 
ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL;