ALTER TABLE public.task_completions
ADD COLUMN issue_reported BOOLEAN NOT NULL DEFAULT FALSE;

-- We need to drop and re-create policies to include the new column
DROP POLICY IF EXISTS "Users can insert their own records" ON public.task_completions;
DROP POLICY IF EXISTS "Users can update their own records" ON public.task_completions;

CREATE POLICY "Users can insert their own records" ON public.task_completions
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT employee_id FROM room_cleaning_sessions WHERE id = session_id
  )
);

CREATE POLICY "Users can update their own records" ON public.task_completions
FOR UPDATE USING (
  auth.uid() IN (
    SELECT employee_id FROM room_cleaning_sessions WHERE id = session_id
  )
);