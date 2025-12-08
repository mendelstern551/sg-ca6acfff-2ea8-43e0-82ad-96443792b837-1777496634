-- Enable RLS on feedback_submissions to make the existing policies active
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Just to be safe, reload schema cache
NOTIFY pgrst, 'reload schema';