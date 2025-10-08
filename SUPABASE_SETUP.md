# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: `swiftpay`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"

## 2. Get Project Credentials

After creating the project, go to **Settings** → **API** and copy:
- **Project URL** (SUPABASE_URL)
- **anon public** key (SUPABASE_ANON_KEY)
- **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## 3. Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `server/supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL to create tables and policies

## 4. Environment Variables

Create `.env` files with these variables:

### Server (.env)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
PORT=3001
NODE_ENV=development
COINGECKO_API_KEY=CG-4t9T7hqedfTufESUnfqJu4mr
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Client (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_COINGECKO_API_KEY=CG-4t9T7hqedfTufESUnfqJu4mr
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 5. Features Enabled

- ✅ PostgreSQL database with proper schema
- ✅ Row Level Security (RLS) policies
- ✅ Real-time subscriptions
- ✅ Authentication system
- ✅ Auto-generated APIs
- ✅ Database triggers for updated_at timestamps

## 6. Next Steps

1. Set up authentication in Supabase dashboard
2. Configure email templates
3. Set up webhooks for transaction notifications
4. Deploy backend to production
