-- Add user_id to employees table to link to authenticated user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='user_id') THEN
        ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Create profiles table to store roles, if it doesn"t exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'employee'
);

-- Enable RLS on profiles if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'profiles' AND relrowsecurity
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policies for profiles if they don"t exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own profile' AND polrelid = 'public.profiles'::regclass) THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own profile' AND polrelid = 'public.profiles'::regclass) THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- Create is_admin function for permission checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create the rooms table for room management
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    floor TEXT,
    bed_count INTEGER DEFAULT 0,
    bunk_bed_count INTEGER DEFAULT 0,
    map_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rooms if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'rooms' AND relrowsecurity
    ) THEN
        ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policies for rooms if they don"t exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can view rooms' AND polrelid = 'public.rooms'::regclass) THEN
        CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage rooms' AND polrelid = 'public.rooms'::regclass) THEN
        CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;
END
$$;

-- Add columns to buildings table if they don"t exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='map_image_url' AND table_schema='public') THEN
        ALTER TABLE public.buildings ADD COLUMN map_image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='target_heating_level' AND table_schema='public') THEN
        ALTER TABLE public.buildings ADD COLUMN target_heating_level NUMERIC(4, 1) DEFAULT 70.0;
    END IF;
END
$$;

-- Add room_id to task_logs table if it doesn"t exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='task_logs' AND column_name='room_id') THEN
        ALTER TABLE public.task_logs ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Create the issues table for reporting problems
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    task_log_id UUID REFERENCES public.task_logs(id) ON DELETE SET NULL,
    reported_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- e.g., new, acknowledged, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on issues if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'issues' AND relrowsecurity
    ) THEN
        ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Drop old, incorrect policies before creating new ones
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Employees can view their reported issues' AND polrelid = 'public.issues'::regclass) THEN
        DROP POLICY "Employees can view their reported issues" ON public.issues;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Employees can create issues' AND polrelid = 'public.issues'::regclass) THEN
        DROP POLICY "Employees can create issues" ON public.issues;
    END IF;
END
$$;


-- Create correct policies for issues table
DO $$
BEGIN
    -- Policy for employees to view issues they reported
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Employees can view their own reported issues' AND polrelid = 'public.issues'::regclass) THEN
        CREATE POLICY "Employees can view their own reported issues" ON public.issues FOR SELECT
            USING (auth.uid() = (SELECT user_id FROM public.employees WHERE id = reported_by_employee_id));
    END IF;

    -- Policy for employees to create new issues
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Employees can create new issues' AND polrelid = 'public.issues'::regclass) THEN
        CREATE POLICY "Employees can create new issues" ON public.issues FOR INSERT
            WITH CHECK (auth.uid() = (SELECT user_id FROM public.employees WHERE id = reported_by_employee_id));
    END IF;
    
    -- Policy for admins to manage all issues
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage all issues' AND polrelid = 'public.issues'::regclass) THEN
        CREATE POLICY "Admins can manage all issues" ON public.issues FOR ALL
            USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;
END
$$;

-- Change policies on existing tables to be admin-only where appropriate
-- For employees, only admins should be able to do anything except for the employee themselves updating their own limited data
ALTER POLICY "Allow all operations on employees" ON public.employees RENAME TO "Admins can manage employees";
ALTER POLICY "Admins can manage employees" ON public.employees USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Employees can view their own record" ON public.employees FOR SELECT USING (auth.uid() = user_id);

-- For buildings, only admins should manage them
ALTER POLICY "Allow all operations on buildings" ON public.buildings RENAME TO "Admins can manage buildings";
ALTER POLICY "Admins can manage buildings" ON public.buildings USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view buildings" ON public.buildings FOR SELECT USING (true);

-- For task_types, only admins should manage them
ALTER POLICY "Allow all operations on task_types" ON public.task_types RENAME TO "Admins can manage task_types";
ALTER POLICY "Admins can manage task_types" ON public.task_types USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view task_types" ON public.task_types FOR SELECT USING (true);

-- For time_entries and task_logs, employees should be able to create them for themselves
ALTER POLICY "Allow all operations on time_entries" ON public.time_entries RENAME TO "Admins can manage all time_entries";
ALTER POLICY "Admins can manage all time_entries" ON public.time_entries USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Employees can manage their own time_entries" ON public.time_entries FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public.employees WHERE id = employee_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.employees WHERE id = employee_id));

ALTER POLICY "Allow all operations on task_logs" ON public.task_logs RENAME TO "Admins can manage all task_logs";
ALTER POLICY "Admins can manage all task_logs" ON public.task_logs USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Employees can manage their own task_logs" ON public.task_logs FOR ALL
    USING (auth.uid() = (SELECT user_id FROM public.employees WHERE id = employee_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.employees WHERE id = employee_id));