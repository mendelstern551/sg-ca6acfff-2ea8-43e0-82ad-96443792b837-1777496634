-- Add the booking_id foreign key to the manager_compensation table
ALTER TABLE public.manager_compensation 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;