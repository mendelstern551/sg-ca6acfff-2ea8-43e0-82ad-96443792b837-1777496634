-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_invoices_with_booking();

-- Now create the correct version
CREATE OR REPLACE FUNCTION public.get_invoices_with_booking()
RETURNS TABLE (
  id UUID,
  booking_id UUID,
  invoice_number TEXT,
  amount NUMERIC,
  status TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  booking_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.booking_id,
    i.invoice_number,
    i.amount,
    i.status,
    i.due_date,
    i.created_at,
    jsonb_build_object(
      'id', b.id,
      'client_name', b.client_name,
      'client_email', b.client_email,
      'client_phone', b.client_phone,
      'start_date', b.start_date,
      'end_date', b.end_date,
      'status', b.status,
      'total_cost', b.total_cost
    ) as booking_data
  FROM invoices i
  LEFT JOIN bookings b ON i.booking_id = b.id
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_invoices_with_booking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoices_with_booking() TO anon;