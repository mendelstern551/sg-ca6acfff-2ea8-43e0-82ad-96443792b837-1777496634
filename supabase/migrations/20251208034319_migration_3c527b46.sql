-- Add a comment to force schema cache refresh
COMMENT ON TABLE feedback_submissions IS 'Customer feedback submissions with bonus credit tracking';

-- Force a minor schema update
ALTER TABLE feedback_submissions ALTER COLUMN updated_at SET DEFAULT NOW();