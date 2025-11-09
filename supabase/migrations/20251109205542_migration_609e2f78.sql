-- ============================================================
-- 🔧 FIX AUTH RLS INITIALIZATION PLAN WARNINGS
-- ============================================================
-- This migration optimizes ALL RLS policies to use (select auth.uid())
-- instead of bare auth.uid() calls, preventing per-row re-evaluation.
-- 
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================

-- ============================================================
-- 1️⃣ PROFILES TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING ((select auth.uid()) = id);

-- ============================================================
-- 2️⃣ BOOKINGS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;

CREATE POLICY "Users can manage their own bookings" ON bookings
FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================
-- 3️⃣ CONTRACTS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can manage contracts for their bookings" ON contracts;

CREATE POLICY "Users can manage contracts for their bookings" ON contracts
FOR ALL USING (
  (select auth.uid()) IN (
    SELECT bookings.user_id
    FROM bookings
    WHERE bookings.id = contracts.booking_id
  )
);

-- ============================================================
-- 4️⃣ INVOICES TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can manage invoices for their bookings" ON invoices;

CREATE POLICY "Users can manage invoices for their bookings" ON invoices
FOR ALL USING (
  (select auth.uid()) IN (
    SELECT bookings.user_id
    FROM bookings
    WHERE bookings.id = invoices.booking_id
  )
);

-- ============================================================
-- 5️⃣ PAYMENTS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can manage payments for their bookings" ON payments;

CREATE POLICY "Users can manage payments for their bookings" ON payments
FOR ALL USING (
  (select auth.uid()) IN (
    SELECT bookings.user_id
    FROM bookings
    WHERE bookings.id = payments.booking_id
  )
);

-- ============================================================
-- 6️⃣ TIME_ENTRIES TABLE
-- ============================================================
DROP POLICY IF EXISTS "Employees can manage their own time entries" ON time_entries;

CREATE POLICY "Employees can manage their own time entries" ON time_entries
FOR ALL USING (
  (select auth.uid()) IN (
    SELECT employees.user_id
    FROM employees
    WHERE employees.id = time_entries.employee_id
  )
);

-- ============================================================
-- 7️⃣ TASK_LOGS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Employees can manage their own task logs" ON task_logs;

CREATE POLICY "Employees can manage their own task logs" ON task_logs
FOR ALL USING (
  (select auth.uid()) IN (
    SELECT employees.user_id
    FROM employees
    WHERE employees.id = task_logs.employee_id
  )
);

-- ============================================================
-- 8️⃣ ISSUES TABLE
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage issues" ON issues;

-- ✅ IMPROVED: Use auth.uid() check instead of role() check for better performance
CREATE POLICY "Authenticated users can manage issues" ON issues
FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- 9️⃣ REMINDERS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;

CREATE POLICY "Users can manage their own reminders" ON reminders
FOR ALL USING ((select auth.uid()) = user_id);

-- ============================================================
-- 🎯 TASK_COMPLETIONS TABLE (Bonus Optimization)
-- ============================================================
-- These policies were already partially optimized but can be improved
DROP POLICY IF EXISTS "Users can insert their own records" ON task_completions;
DROP POLICY IF EXISTS "Users can update their own records" ON task_completions;

CREATE POLICY "Users can insert their own records" ON task_completions
FOR INSERT WITH CHECK (
  (select auth.uid()) IN (
    SELECT room_cleaning_sessions.employee_id
    FROM room_cleaning_sessions
    WHERE room_cleaning_sessions.id = task_completions.session_id
  )
);

CREATE POLICY "Users can update their own records" ON task_completions
FOR UPDATE USING (
  (select auth.uid()) IN (
    SELECT room_cleaning_sessions.employee_id
    FROM room_cleaning_sessions
    WHERE room_cleaning_sessions.id = task_completions.session_id
  )
);

-- ============================================================
-- ✅ OPTIMIZATION COMPLETE
-- ============================================================
-- All RLS policies now use (select auth.uid()) pattern
-- This prevents per-row re-evaluation and dramatically improves query performance
-- Run Supabase Performance Linter again to verify all warnings are resolved
-- ============================================================