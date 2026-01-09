# Supabase Setup Instructions for StockNeuro

## Step-by-Step Guide

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up/Login with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: `stockneuro` (or your choice)
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start
6. Click "Create new project"
7. Wait 2-3 minutes for project to initialize

---

### 2. Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

---

### 3. Run SQL Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy **ENTIRE** contents of `supabase_migration.sql`
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for "Success" message
7. Verify tables created: Go to **Table Editor** → You should see:
   - `user_profiles`
   - `watchlists`
   - `predictions`
   - `portfolios`
   - `prediction_analytics`
   - `portfolio_history`

---

### 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable providers you want:
   - ✅ **Email** (enabled by default)
   - ✅ **Google** (optional - requires OAuth setup)
   - ✅ **GitHub** (optional - requires OAuth setup)

3. Configure Email:
   - **Enable Email Signup**: ✅ ON
   - **Confirm Email**: ✅ ON (recommended for production)
   - **Secure Email Change**: ✅ ON

---

### 5. Set Up Environment Variables

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Backend (.env)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

---

### 6. Install Dependencies

#### Frontend
```bash
cd frontend
npm install @supabase/supabase-js
```

#### Backend
```bash
cd backend
pip install supabase
```

---

### 7. Test Connection

Run this in Supabase SQL Editor to test:
```sql
SELECT * FROM user_profiles LIMIT 1;
```

Should return empty result (no error = success!)

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] API keys copied
- [ ] SQL migration ran successfully
- [ ] All 6 tables visible in Table Editor
- [ ] Authentication providers configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Test query works

---

## 🎉 You're Ready!

Your Supabase database is now set up and ready for StockNeuro integration!





