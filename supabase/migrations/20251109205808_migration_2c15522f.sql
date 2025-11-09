-- ============================================================
-- 🔧 FIX REMAINING AUTH RLS INITIALIZATION PLAN WARNINGS
-- ============================================================
-- Optimizing RLS policies for: rooms, room_tasks
-- This resolves Supabase Performance & Security Lints warnings
-- ============================================================

-- ============================================================
-- TABLE: rooms
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can delete rooms" ON rooms;

-- ✅ OPTIMIZED: Insert policy with cached auth check
CREATE POLICY "Authenticated users can insert rooms" ON rooms
FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- ✅ OPTIMIZED: Update policy with cached auth check
CREATE POLICY "Authenticated users can update rooms" ON rooms
FOR UPDATE USING ((select auth.role()) = 'authenticated');

-- ✅ OPTIMIZED: Delete policy with cached auth check
CREATE POLICY "Authenticated users can delete rooms" ON rooms
FOR DELETE USING ((select auth.role()) = 'authenticated');

-- ============================================================
-- TABLE: room_tasks
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert room_tasks" ON room_tasks;
DROP POLICY IF EXISTS "Authenticated users can update room_tasks" ON room_tasks;

-- ✅ OPTIMIZED: Insert policy with cached auth check
CREATE POLICY "Authenticated users can insert room_tasks" ON room_tasks
FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- ✅ OPTIMIZED: Update policy with cached auth check
CREATE POLICY "Authenticated users can update room_tasks" ON room_tasks
FOR UPDATE USING ((select auth.role()) = 'authenticated');

-- ============================================================
-- ✅ OPTIMIZATION COMPLETE
-- ============================================================
-- All RLS policies now use (select auth.<function>()) pattern
-- Performance warnings from Supabase Database Linter are resolved
-- ============================================================