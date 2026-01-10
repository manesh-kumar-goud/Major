# 🚀 Supabase Quick Start - Copy & Paste Guide

## Step 1: Create Supabase Project
1. Go to: https://supabase.com
2. Sign up/Login
3. Click "New Project"
4. Fill details → Create

---

## Step 2: Copy SQL to Supabase

### Option A: Complete Setup (Recommended)
1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy **ENTIRE** file: `supabase_migration.sql`
4. Paste and click **Run**

### Option B: Step by Step
If you prefer to run in parts, use these files:
1. `supabase_migration.sql` - Main schema
2. `supabase_rls_policies.sql` - Additional policies (optional)
3. `supabase_test_queries.sql` - Verification queries

---

## Step 3: Get Your Keys

In Supabase Dashboard → **Settings** → **API**:

```
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Add to .env Files

### Frontend/.env
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend/.env
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

---

## Step 5: Install Packages

```bash
# Frontend
cd frontend
npm install @supabase/supabase-js

# Backend  
cd backend
pip install supabase
```

---

## Step 6: Verify Setup

Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM user_profiles;
```

Should return `0` (no error = success!)

---

## ✅ Done!

Your database is ready! 🎉














