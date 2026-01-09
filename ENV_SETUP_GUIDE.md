# Environment Variables Setup Guide

## 📋 Quick Setup

### Step 1: Backend (.env)

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `backend/.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=your-service-role-key-here
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 2: Frontend (.env)

1. Copy the example file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `frontend/.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## 🔑 Where to Get Supabase Keys

1. Go to your Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_KEY` (backend only, keep secret!)

---

## 📝 Complete Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key

# RapidAPI (Yahoo Finance)
RAPIDAPI_KEY=your-rapidapi-key

# Other existing variables...
```

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API
VITE_API_URL=http://localhost:5000/api
```

---

## ⚠️ Important Notes

1. **Never commit `.env` files to Git!** They're already in `.gitignore`
2. **Service Role Key** is secret - only use in backend, never expose to frontend
3. **Anon Key** is safe for frontend - it's protected by Row Level Security (RLS)
4. **VITE_** prefix is required for Vite to expose variables to frontend

---

## ✅ Verification

After setting up, verify the connection:

### Backend Test
```python
from core.config import settings
print(settings.SUPABASE_URL)  # Should print your Supabase URL
```

### Frontend Test
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)  // Should print your Supabase URL
```

---

## 🚀 Next Steps

1. ✅ Set up environment variables
2. ✅ Run Supabase SQL migration
3. ✅ Install Supabase packages
4. ✅ Start integrating!





