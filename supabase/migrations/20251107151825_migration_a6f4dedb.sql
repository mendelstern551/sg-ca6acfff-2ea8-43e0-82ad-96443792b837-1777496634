-- Enable RLS and create a public read policy for buildings
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to buildings" ON public.buildings FOR SELECT TO anon USING (true);

-- Enable RLS and create a public read policy for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to rooms" ON public.rooms FOR SELECT TO anon USING (true);