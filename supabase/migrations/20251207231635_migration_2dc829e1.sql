-- 1. Create feedback_submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER,
  feedback_text TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bonus_credit_issued BOOLEAN DEFAULT FALSE,
  bonus_credit_amount DECIMAL(10, 2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Public/Authenticated access as appropriate)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback_submissions' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON feedback_submissions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback_submissions' AND policyname = 'Enable insert for all users'
    ) THEN
        CREATE POLICY "Enable insert for all users" ON feedback_submissions FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback_submissions' AND policyname = 'Enable update for all users'
    ) THEN
        CREATE POLICY "Enable update for all users" ON feedback_submissions FOR UPDATE USING (true);
    END IF;
END
$$;