ALTER TABLE public.manager_compensation
ADD COLUMN manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;