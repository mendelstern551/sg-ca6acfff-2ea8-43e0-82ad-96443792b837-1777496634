ALTER TABLE public.manager_compensation ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION get_monthly_manager_salary(p_employee_id UUID, p_year INT)
RETURNS TABLE(month TEXT, total_salary NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(mc.due_date, 'YYYY-MM') AS month,
        SUM(mc.amount) AS total_salary
    FROM
        public.manager_compensation mc
    WHERE
        mc.manager_id = p_employee_id
        AND EXTRACT(YEAR FROM mc.due_date) = p_year
    GROUP BY
        TO_CHAR(mc.due_date, 'YYYY-MM')
    ORDER BY
        month;
END;
$$;