-- Make amount column use total_amount as default if not provided
-- This way we can avoid sending 'amount' in the REST API payload
ALTER TABLE invoices 
ALTER COLUMN amount SET DEFAULT 0;

-- Create a trigger to auto-populate amount from total_amount
CREATE OR REPLACE FUNCTION set_invoice_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- If amount is 0 or NULL, copy from total_amount
  IF NEW.amount IS NULL OR NEW.amount = 0 THEN
    NEW.amount := COALESCE(NEW.total_amount, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;