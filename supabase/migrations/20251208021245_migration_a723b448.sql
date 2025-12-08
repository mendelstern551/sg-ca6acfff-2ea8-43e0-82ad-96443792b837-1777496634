-- Create feedback_submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  areas_of_improvement TEXT[],
  bonus_credit_issued BOOLEAN DEFAULT FALSE,
  bonus_credit_amount NUMERIC DEFAULT 50.00,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view feedback submissions" 
  ON feedback_submissions FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert feedback submissions" 
  ON feedback_submissions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update feedback submissions" 
  ON feedback_submissions FOR UPDATE 
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_booking_id 
  ON feedback_submissions(booking_id);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_submission_date 
  ON feedback_submissions(submission_date DESC);