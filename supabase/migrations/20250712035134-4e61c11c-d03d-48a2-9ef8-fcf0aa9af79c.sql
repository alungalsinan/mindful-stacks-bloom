
-- First, let's update the users table to make it the primary authentication table
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Update profiles table to reference users instead of auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Make email optional in profiles since we're removing email auth
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Update circulation table to properly reference users
ALTER TABLE public.circulation DROP CONSTRAINT IF EXISTS circulation_checked_out_by_fkey;
ALTER TABLE public.circulation ADD CONSTRAINT circulation_checked_out_by_fkey 
  FOREIGN KEY (checked_out_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update notifications table to reference users
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update reviews table to reference users
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update reader_stats table to reference users
ALTER TABLE public.reader_stats DROP CONSTRAINT IF EXISTS reader_stats_user_id_fkey;
ALTER TABLE public.reader_stats ADD CONSTRAINT reader_stats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update RLS policies to work with custom auth
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (true);

-- Allow profile creation during signup
CREATE POLICY "Anyone can create profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Update other policies to work without auth.uid()
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update reviews" ON public.reviews
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete reviews" ON public.reviews
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view their own stats" ON public.reader_stats;
CREATE POLICY "Users can view stats" ON public.reader_stats
  FOR SELECT USING (true);

-- Create a function to update user stats (simplified without auth.uid())
CREATE OR REPLACE FUNCTION public.update_reader_stats_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
  book_pages INTEGER;
BEGIN
  -- Get the user_id from circulation via patron
  SELECT p.id INTO user_profile_id
  FROM public.patrons pt
  JOIN public.profiles p ON pt.email = p.email
  WHERE pt.id = COALESCE(NEW.patron_id, OLD.patron_id);

  -- Get book pages
  SELECT pages INTO book_pages
  FROM public.books
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);

  -- Update stats for the current month
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'checked_out' AND NEW.status = 'checked_out') THEN
    -- Book borrowed
    INSERT INTO public.reader_stats (user_id, month, year, books_borrowed)
    VALUES (
      user_profile_id,
      EXTRACT(MONTH FROM CURRENT_DATE),
      EXTRACT(YEAR FROM CURRENT_DATE),
      1
    )
    ON CONFLICT (user_id, month, year)
    DO UPDATE SET
      books_borrowed = reader_stats.books_borrowed + 1,
      updated_at = now();
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'checked_out' AND NEW.status = 'returned' THEN
    -- Book returned
    INSERT INTO public.reader_stats (user_id, month, year, books_returned, total_pages_read)
    VALUES (
      user_profile_id,
      EXTRACT(MONTH FROM CURRENT_DATE),
      EXTRACT(YEAR FROM CURRENT_DATE),
      1,
      COALESCE(book_pages, 0)
    )
    ON CONFLICT (user_id, month, year)
    DO UPDATE SET
      books_returned = reader_stats.books_returned + 1,
      total_pages_read = reader_stats.total_pages_read + COALESCE(book_pages, 0),
      updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for updating reader stats
DROP TRIGGER IF EXISTS update_reader_stats_trigger ON public.circulation;
CREATE TRIGGER update_reader_stats_trigger
  AFTER INSERT OR UPDATE ON public.circulation
  FOR EACH ROW EXECUTE FUNCTION public.update_reader_stats_simple();

-- Update the can_borrow_book function to work without auth.uid()
CREATE OR REPLACE FUNCTION public.can_borrow_book(p_user_id uuid, p_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_copies INTEGER;
  current_borrowed INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Check available copies
  SELECT available_copies INTO available_copies
  FROM public.books
  WHERE id = p_book_id;
  
  IF available_copies IS NULL OR available_copies <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check user's current borrowed books count
  SELECT COUNT(*) INTO current_borrowed
  FROM public.circulation c
  JOIN public.patrons pt ON c.patron_id = pt.id
  JOIN public.profiles p ON pt.email = p.email
  WHERE p.id = p_user_id AND c.status = 'checked_out';
  
  -- Get max allowed books for user (default 5)
  SELECT COALESCE(5) INTO max_allowed;
  
  RETURN current_borrowed < max_allowed;
END;
$$;

-- Create a function to get top readers without auth.uid()
CREATE OR REPLACE FUNCTION public.get_top_readers_simple(p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer, p_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, full_name text, email text, books_borrowed integer, books_returned integer, total_pages_read integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.user_id,
    p.full_name,
    COALESCE(p.email, 'N/A') as email,
    rs.books_borrowed,
    rs.books_returned,
    rs.total_pages_read
  FROM public.reader_stats rs
  JOIN public.profiles p ON rs.user_id = p.id
  WHERE 
    (p_month IS NULL OR rs.month = p_month) AND
    (p_year IS NULL OR rs.year = p_year)
  ORDER BY rs.books_borrowed DESC, rs.total_pages_read DESC
  LIMIT p_limit;
END;
$$;
