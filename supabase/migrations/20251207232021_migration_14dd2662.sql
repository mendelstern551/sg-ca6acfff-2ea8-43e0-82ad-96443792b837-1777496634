-- Create feedback_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER,
  feedback_text TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bonus_credit_issued BOOLEAN DEFAULT FALSE,
  bonus_credit_amount NUMERIC DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Users can view feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Users can update feedback" ON feedback_submissions;

-- Create policies
CREATE POLICY "Public can insert feedback" ON feedback_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view feedback" ON feedback_submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update feedback" ON feedback_submissions FOR UPDATE USING (auth.uid() IS NOT NULL);