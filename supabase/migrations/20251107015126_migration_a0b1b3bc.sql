-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  id_photo_url TEXT,
  hourly_rate DECIMAL(10, 2),
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_types table
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table (clock in/out records)
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  entry_type TEXT DEFAULT 'work' CHECK (entry_type IN ('work', 'break')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_logs table (what employees did and when)
CREATE TABLE IF NOT EXISTS task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_task_logs_employee ON task_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_building ON task_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_started_at ON task_logs(started_at);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all authenticated users for now - can be refined)
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on buildings" ON buildings FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_types" ON task_types FOR ALL USING (true);
CREATE POLICY "Allow all operations on time_entries" ON time_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_logs" ON task_logs FOR ALL USING (true);

-- Insert default buildings
INSERT INTO buildings (name, address, description) VALUES
  ('Main Lodge', '123 Lake Rd, Trout Lake', 'Main building with guest rooms and dining hall'),
  ('Guest House A', '125 Lake Rd, Trout Lake', 'Guest house with 10 rooms'),
  ('Guest House B', '127 Lake Rd, Trout Lake', 'Guest house with 8 rooms'),
  ('Activity Center', '130 Lake Rd, Trout Lake', 'Recreation and event space');

-- Insert default task types for each building
INSERT INTO task_types (name, description, building_id)
SELECT 'Linen Change', 'Replace and launder bed linens', id FROM buildings
UNION ALL
SELECT 'Garbage Collection', 'Empty trash bins and replace bags', id FROM buildings
UNION ALL
SELECT 'Room Cleaning', 'Vacuum, dust, and sanitize rooms', id FROM buildings
UNION ALL
SELECT 'Bathroom Cleaning', 'Clean and sanitize bathrooms', id FROM buildings
UNION ALL
SELECT 'Table Removal/Setup', 'Set up or remove tables for events', id FROM buildings
UNION ALL
SELECT 'Floor Mopping', 'Mop all floor surfaces', id FROM buildings
UNION ALL
SELECT 'Window Cleaning', 'Clean interior and exterior windows', id FROM buildings;