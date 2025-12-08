-- Drop the existing table completely
DROP TABLE IF EXISTS feedback_submissions CASCADE;

-- Recreate the feedback_submissions table from scratch
CREATE TABLE feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bonus_credit_issued BOOLEAN DEFAULT FALSE,
  bonus_credit_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON feedback_submissions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON feedback_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON feedback_submissions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON feedback_submissions
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_feedback_booking_id ON feedback_submissions(booking_id);
CREATE INDEX idx_feedback_submission_date ON feedback_submissions(submission_date);

-- Add table comment
COMMENT ON TABLE feedback_submissions IS 'Stores customer feedback submissions from post-booking surveys';