# 🎯 Final Setup Instructions - Add Service Role Key

## ⚠️ IMPORTANT: Backend Needs Service Role Key

Your backend `.env` file is missing `SUPABASE_KEY` (service role key).

### Quick Fix:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com
   - Open your project

2. **Get Service Role Key**
   - Click **Settings** → **API**
   - Scroll to **Project API keys**
   - Find **service_role** key (it's secret!)
   - Click **Copy** or **Reveal**

3. **Add to `backend/.env`**
   
   Open `backend/.env` and add this line:
   ```env
   SUPABASE_KEY=your-service-role-key-paste-here
   ```
   
   Your complete Supabase section should look like:
   ```env
   SUPABASE_URL=https://vpwoddhccnbknnrlocnl.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
   ```

4. **Test Connection**
   ```bash
   cd backend
   python test_supabase_connection.py
   ```
   
   Should show: ✅ Supabase connection successful!

---

## ✅ What's Already Done

- ✅ Frontend configured
- ✅ Database tables created
- ✅ Code integration complete
- ✅ JWT token decoding added
- ✅ Predictions saving to Supabase
- ✅ Portfolio integration ready

---

## 🚀 After Adding Service Role Key

Everything will work! Test:

1. **Start Backend**
   ```bash
   cd backend
   python -m uvicorn app:app --reload
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test**
   - Sign up at http://localhost:5173/login
   - Add stock to watchlist
   - Make prediction
   - Check Supabase dashboard → Table Editor

---

**That's it!** Just add the service role key and you're done! 🎉














