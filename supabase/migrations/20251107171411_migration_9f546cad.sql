-- Employees and Time Tracking
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    pay_rate NUMERIC,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage employees" ON employees FOR ALL USING (true); -- Simplified

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    entry_type TEXT NOT NULL DEFAULT 'work', -- 'work', 'break'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own time entries" ON time_entries FOR ALL USING (
  (SELECT user_id FROM employees WHERE id = employee_id) = auth.uid()
);
CREATE POLICY "Admin can see all time entries" ON time_entries FOR SELECT USING (true);


-- Tasks and Issues
CREATE TABLE IF NOT EXISTS task_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for task types" ON task_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can manage task types" ON task_types FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    task_type_id UUID REFERENCES task_types(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT
);
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can manage their own task logs" ON task_logs FOR ALL USING (
  (SELECT user_id FROM employees WHERE id = employee_id) = auth.uid()
);
CREATE POLICY "Admin can see all task logs" ON task_logs FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    room_id UUID REFERENCES rooms(id),
    reported_by_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage issues" ON issues FOR ALL USING (auth.role() = 'authenticated');