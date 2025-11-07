-- Create rooms table with bed counts and building information
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  floor_level TEXT NOT NULL,
  bed_count INTEGER NOT NULL DEFAULT 0,
  has_bunk_beds BOOLEAN DEFAULT FALSE,
  map_coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_name, room_number)
);

-- Create room_tasks table for configurable task lists
CREATE TABLE IF NOT EXISTS room_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name TEXT NOT NULL,
  task_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_cleaning_sessions table for tracking cleaning progress
CREATE TABLE IF NOT EXISTS room_cleaning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'paused'))
);

-- Create task_completions table for individual task tracking
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES room_cleaning_sessions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES room_tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_issues table for tracking problems
CREATE TABLE IF NOT EXISTS room_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  session_id UUID REFERENCES room_cleaning_sessions(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_issue_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Create building_settings table for admin-configurable settings
CREATE TABLE IF NOT EXISTS building_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_name TEXT NOT NULL UNIQUE,
  heating_level INTEGER DEFAULT 20,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_cleaning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_settings ENABLE ROW LEVEL SECURITY;

-- Create public read policies (anyone can view)
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can view room_tasks" ON room_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can view room_cleaning_sessions" ON room_cleaning_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can view task_completions" ON task_completions FOR SELECT USING (true);
CREATE POLICY "Anyone can view room_issues" ON room_issues FOR SELECT USING (true);
CREATE POLICY "Anyone can view building_settings" ON building_settings FOR SELECT USING (true);

-- Create authenticated write policies
CREATE POLICY "Authenticated users can insert rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update rooms" ON rooms FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete rooms" ON rooms FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert room_tasks" ON room_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update room_tasks" ON room_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete room_tasks" ON room_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sessions" ON room_cleaning_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sessions" ON room_cleaning_sessions FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert task_completions" ON task_completions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update task_completions" ON task_completions FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert issues" ON room_issues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update issues" ON room_issues FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert building_settings" ON building_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update building_settings" ON building_settings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insert default room tasks
INSERT INTO room_tasks (task_name, task_order, is_required) VALUES
  ('Remove linen and towels', 1, true),
  ('Clean floor', 2, true),
  ('Check heating level', 3, true),
  ('Take out garbage', 4, true),
  ('Put new linen', 5, true),
  ('Clean toilet', 6, true),
  ('Check for leaks (toilet, sink)', 7, true),
  ('Check all lights working', 8, true)
ON CONFLICT DO NOTHING;