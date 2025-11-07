-- Alter 'bookings' table to add missing fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS booking_type TEXT,
  ADD COLUMN IF NOT EXISTS number_of_guests INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER,
  ADD COLUMN IF NOT EXISTS base_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS per_person_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS additional_cleaning_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC,
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_price BOOLEAN,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Rename columns in 'bookings' table
ALTER TABLE public.bookings RENAME COLUMN client_name TO contact_name;
ALTER TABLE public.bookings RENAME COLUMN client_email TO contact_email;
ALTER TABLE public.bookings RENAME COLUMN client_phone TO contact_phone;
ALTER TABLE public.bookings RENAME COLUMN total_price TO total_cost;

-- Alter 'employees' table
ALTER TABLE public.employees RENAME COLUMN name TO full_name;
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS id_photo_url TEXT;

-- Alter 'rooms' table
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS bed_count INTEGER,
  ADD COLUMN IF NOT EXISTS bunk_bed_count INTEGER,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS map_image_url TEXT;

-- Alter 'buildings' table
ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS target_heating_level NUMERIC;

-- Alter 'expenses' table
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS vendor TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS receipt_urls TEXT[],
  ADD COLUMN IF NOT EXISTS proof_urls TEXT[];

-- Alter 'invoices' table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS event_date_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS event_date_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS number_of_guests INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_status TEXT,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER;

-- Alter 'email_logs' table
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Alter 'payments' table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS notes TEXT;
  
-- Alter 'task_logs' table
ALTER TABLE public.task_logs
  ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES time_entries(id);

-- Alter 'time_entries' table
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS location_lon NUMERIC;

-- Alter 'issues' table
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS task_log_id UUID REFERENCES task_logs(id);