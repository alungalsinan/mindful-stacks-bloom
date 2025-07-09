
-- Create users table for custom authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (id = auth.uid()::uuid);

-- Create policy for public signup (insert)
CREATE POLICY "Anyone can create user" ON public.users
  FOR INSERT WITH CHECK (true);

-- Create sessions table for JWT token management
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for session management
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Update profiles table to reference new users table instead of auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username(username TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT username ~ '^[a-zA-Z0-9_]{3,20}$' AND LENGTH(username) >= 3;
$$;

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION public.username_exists(username TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE users.username = username_exists.username
  );
$$;
