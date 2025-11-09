-- ============================================================
-- 🔧 FIX AUTH RLS INITIALIZATION PLAN WARNINGS
-- ============================================================
-- Optimize all RLS policies by wrapping auth.uid() in subqueries
-- This prevents re-evaluation per row and improves query performance
-- ============================================================

-- 1. PROFILES TABLE (2 policies)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING ((select auth.uid()) = id);

-- 2. CONTRACTS TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage contracts for their bookings" ON contracts;
CREATE POLICY "Users can manage contracts for their bookings" ON contracts
FOR ALL USING ((
  SELECT bookings.user_id
  FROM bookings
  WHERE (bookings.id = contracts.booking_id)
) = (select auth.uid()));

-- 3. TASK_COMPLETIONS TABLE (2 policies)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own records" ON task_completions;
CREATE POLICY "Users can insert their own records" ON task_completions
FOR INSERT WITH CHECK ((select auth.uid()) IN (
  SELECT room_cleaning_sessions.employee_id
  FROM room_cleaning_sessions
  WHERE (room_cleaning_sessions.id = task_completions.session_id)
));

DROP POLICY IF EXISTS "Users can update their own records" ON task_completions;
CREATE POLICY "Users can update their own records" ON task_completions
FOR UPDATE USING ((select auth.uid()) IN (
  SELECT room_cleaning_sessions.employee_id
  FROM room_cleaning_sessions
  WHERE (room_cleaning_sessions.id = task_completions.session_id)
));

-- 4. TASK_LOGS TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Employees can manage their own task logs" ON task_logs;
CREATE POLICY "Employees can manage their own task logs" ON task_logs
FOR ALL USING ((
  SELECT employees.user_id
  FROM employees
  WHERE (employees.id = task_logs.employee_id)
) = (select auth.uid()));

-- 5. TIME_ENTRIES TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Employees can manage their own time entries" ON time_entries;
CREATE POLICY "Employees can manage their own time entries" ON time_entries
FOR ALL USING ((
  SELECT employees.user_id
  FROM employees
  WHERE (employees.id = time_entries.employee_id)
) = (select auth.uid()));

-- 6. INVOICES TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage invoices for their bookings" ON invoices;
CREATE POLICY "Users can manage invoices for their bookings" ON invoices
FOR ALL USING ((
  SELECT bookings.user_id
  FROM bookings
  WHERE (bookings.id = invoices.booking_id)
) = (select auth.uid()));

-- 7. PAYMENTS TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage payments for their bookings" ON payments;
CREATE POLICY "Users can manage payments for their bookings" ON payments
FOR ALL USING ((
  SELECT bookings.user_id
  FROM bookings
  WHERE (bookings.id = payments.booking_id)
) = (select auth.uid()));

-- 8. BOOKINGS TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
CREATE POLICY "Users can manage their own bookings" ON bookings
FOR ALL USING ((select auth.uid()) = user_id);

-- 9. REMINDERS TABLE (1 policy)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;
CREATE POLICY "Users can manage their own reminders" ON reminders
FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================
-- ✅ OPTIMIZATION COMPLETE
-- ============================================================
-- All RLS policies now use (select auth.uid()) for better performance
-- Auth function calls are now cached per query instead of per row
-- Run Supabase Performance Linter again to verify all warnings are resolved
-- ============================================================