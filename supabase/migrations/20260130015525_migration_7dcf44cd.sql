-- Create trigger to auto-set amount
DROP TRIGGER IF EXISTS trigger_set_invoice_amount ON invoices;
CREATE TRIGGER trigger_set_invoice_amount
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_amount();