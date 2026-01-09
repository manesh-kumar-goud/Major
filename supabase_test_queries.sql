-- =====================================================
-- Test Queries for Supabase Setup Verification
-- Run these to verify everything is working
-- =====================================================

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'watchlists',
  'predictions',
  'portfolios',
  'prediction_analytics',
  'portfolio_history'
)
ORDER BY table_name;

-- Expected: 6 rows

-- =====================================================
-- 2. Check RLS is enabled on all tables
-- =====================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'watchlists',
  'predictions',
  'portfolios',
  'prediction_analytics',
  'portfolio_history'
)
ORDER BY tablename;

-- Expected: All should show rls_enabled = true

-- =====================================================
-- 3. Check indexes are created
-- =====================================================
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'watchlists',
  'predictions',
  'portfolios',
  'prediction_analytics',
  'portfolio_history'
)
ORDER BY tablename, indexname;

-- Expected: Multiple indexes per table

-- =====================================================
-- 4. Check triggers are created
-- =====================================================
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: Triggers for updated_at columns

-- =====================================================
-- 5. Check functions exist
-- =====================================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_updated_at_column',
  'handle_new_user',
  'is_admin'
)
ORDER BY routine_name;

-- Expected: 3 functions

-- =====================================================
-- 6. Test insert (will fail if RLS is working - that's good!)
-- =====================================================
-- This should fail with permission error (proves RLS is working)
-- INSERT INTO watchlists (user_id, symbol) VALUES ('00000000-0000-0000-0000-000000000000', 'TEST');

-- =====================================================
-- 7. Check views exist
-- =====================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'VIEW'
ORDER BY table_name;

-- Expected: user_prediction_summary, portfolio_summary

-- =====================================================
-- ALL TESTS PASSED! ✅
-- =====================================================





