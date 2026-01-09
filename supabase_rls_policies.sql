-- =====================================================
-- Additional Row Level Security (RLS) Policies
-- Run this AFTER the main migration if you need more granular control
-- =====================================================

-- =====================================================
-- PUBLIC READ ACCESS (Optional - for public leaderboards)
-- =====================================================

-- Allow public to view prediction counts (without sensitive data)
-- Note: This allows public read access - remove if you want private only
CREATE POLICY "Public can view prediction counts"
  ON predictions FOR SELECT
  USING (true);

-- Allow public to view user stats (for leaderboards)
-- Note: This allows public read access - remove if you want private only
CREATE POLICY "Public can view user stats"
  ON user_profiles FOR SELECT
  USING (true);

-- =====================================================
-- ADMIN ACCESS (Optional - for admin users)
-- =====================================================

-- Create admin role function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND preferences->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can view all predictions
CREATE POLICY "Admins can view all predictions"
  ON predictions FOR SELECT
  USING (is_admin());

-- Admin can view all portfolios
CREATE POLICY "Admins can view all portfolios"
  ON portfolios FOR SELECT
  USING (is_admin());

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS (Enable for live updates)
-- =====================================================

-- Enable real-time for watchlists
ALTER PUBLICATION supabase_realtime ADD TABLE watchlists;

-- Enable real-time for portfolios
ALTER PUBLICATION supabase_realtime ADD TABLE portfolios;

-- Enable real-time for predictions
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;

-- =====================================================
-- STORAGE BUCKETS (For file uploads - charts, exports)
-- =====================================================

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-exports', 'user-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

