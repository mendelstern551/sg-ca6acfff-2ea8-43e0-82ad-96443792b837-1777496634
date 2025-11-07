-- Temporarily relax RLS policies for development by replacing is_admin() with a check for any authenticated user.

-- employees table
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
CREATE POLICY "Authenticated users can manage employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_types table
DROP POLICY IF EXISTS "Admins can manage task_types" ON public.task_types;
CREATE POLICY "Authenticated users can manage task_types" ON public.task_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- time_entries table
DROP POLICY IF EXISTS "Admins can manage all time_entries" ON public.time_entries;
CREATE POLICY "Authenticated users can manage time_entries" ON public.time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- rooms table
DROP POLICY IF EXISTS "Admins can manage rooms" ON public.rooms;
CREATE POLICY "Authenticated users can manage rooms" ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- buildings table
DROP POLICY IF EXISTS "Admins can manage buildings" ON public.buildings;
CREATE POLICY "Authenticated users can manage buildings" ON public.buildings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_logs table
DROP POLICY IF EXISTS "Admins can manage all task_logs" ON public.task_logs;
CREATE POLICY "Authenticated users can manage task_logs" ON public.task_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- issues table
DROP POLICY IF EXISTS "Admins can manage all issues" ON public.issues;
CREATE POLICY "Authenticated users can manage issues" ON public.issues FOR ALL TO authenticated USING (true) WITH CHECK (true);