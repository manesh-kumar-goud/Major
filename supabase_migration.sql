-- =====================================================
-- StockNeuro Supabase Database Schema
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- =====================================================
-- 2. WATCHLISTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(200),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own watchlist
CREATE POLICY "Users can view own watchlist"
  ON watchlists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert into own watchlist
CREATE POLICY "Users can insert own watchlist"
  ON watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own watchlist
CREATE POLICY "Users can update own watchlist"
  ON watchlists FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete from own watchlist
CREATE POLICY "Users can delete own watchlist"
  ON watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON watchlists(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_symbol ON watchlists(user_id, symbol);

-- =====================================================
-- 3. PREDICTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  model_type VARCHAR(20) NOT NULL,
  period VARCHAR(10),
  prediction_days INTEGER,
  metrics JSONB DEFAULT '{}'::jsonb,
  historical_data JSONB DEFAULT '{}'::jsonb,
  future_predictions JSONB DEFAULT '{}'::jsonb,
  last_price DECIMAL(10, 2),
  predicted_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own predictions
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own predictions
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own predictions
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own predictions
CREATE POLICY "Users can delete own predictions"
  ON predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ticker ON predictions(ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_user_ticker ON predictions(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_model_type ON predictions(model_type);

-- =====================================================
-- 4. PORTFOLIOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  shares DECIMAL(10, 4) NOT NULL DEFAULT 0,
  entry_price DECIMAL(10, 2),
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own portfolio
CREATE POLICY "Users can view own portfolio"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert into own portfolio
CREATE POLICY "Users can insert own portfolio"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own portfolio
CREATE POLICY "Users can update own portfolio"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete from own portfolio
CREATE POLICY "Users can delete own portfolio"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_ticker ON portfolios(ticker);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_ticker ON portfolios(user_id, ticker);

-- =====================================================
-- 5. PREDICTION ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prediction_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actual_price DECIMAL(10, 2),
  predicted_price DECIMAL(10, 2),
  accuracy DECIMAL(5, 2),
  error_percentage DECIMAL(5, 2),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prediction_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view own analytics"
  ON prediction_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analytics
CREATE POLICY "Users can insert own analytics"
  ON prediction_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_prediction_id ON prediction_analytics(prediction_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON prediction_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON prediction_analytics(created_at DESC);

-- =====================================================
-- 6. PORTFOLIO HISTORY TABLE (for charts)
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_balance DECIMAL(12, 2),
  cash_balance DECIMAL(12, 2),
  invested DECIMAL(12, 2),
  total_value DECIMAL(12, 2),
  today_pl DECIMAL(12, 2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own portfolio history"
  ON portfolio_history FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own portfolio history"
  ON portfolio_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_id ON portfolio_history(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_recorded_at ON portfolio_history(recorded_at DESC);

-- =====================================================
-- 7. FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for portfolios
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNCTION: Create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. VIEW: User Prediction Summary
-- =====================================================
CREATE OR REPLACE VIEW user_prediction_summary AS
SELECT 
  user_id,
  COUNT(*) as total_predictions,
  COUNT(DISTINCT ticker) as unique_tickers,
  COUNT(DISTINCT model_type) as models_used,
  AVG((metrics->>'accuracy')::numeric) as avg_accuracy,
  AVG((metrics->>'rmse')::numeric) as avg_rmse,
  MAX(created_at) as last_prediction_date
FROM predictions
GROUP BY user_id;

-- =====================================================
-- 10. VIEW: Portfolio Summary
-- =====================================================
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
  p.user_id,
  COUNT(DISTINCT p.ticker) as holdings_count,
  SUM(p.shares * COALESCE(p.current_price, p.entry_price)) as total_value,
  SUM(p.shares * p.entry_price) as total_invested,
  SUM(p.shares * (COALESCE(p.current_price, p.entry_price) - p.entry_price)) as total_pl,
  AVG((COALESCE(p.current_price, p.entry_price) - p.entry_price) / p.entry_price * 100) as avg_return_percent
FROM portfolios p
GROUP BY p.user_id;

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================
-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 12. SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment below to insert sample data (only for testing)

/*
-- Sample watchlist entry (replace USER_ID with actual user UUID)
INSERT INTO watchlists (user_id, symbol, name) VALUES
('USER_ID_HERE', 'AAPL', 'Apple Inc.'),
('USER_ID_HERE', 'TSLA', 'Tesla Inc.'),
('USER_ID_HERE', 'MSFT', 'Microsoft Corporation');

-- Sample prediction entry
INSERT INTO predictions (user_id, ticker, model_type, period, metrics) VALUES
('USER_ID_HERE', 'AAPL', 'LSTM', '1y', '{"rmse": 0.0234, "mae": 0.0189, "accuracy": 92.5}'::jsonb);
*/

-- =====================================================
-- COMPLETE! 
-- All tables, policies, indexes, and functions are created.
-- =====================================================





