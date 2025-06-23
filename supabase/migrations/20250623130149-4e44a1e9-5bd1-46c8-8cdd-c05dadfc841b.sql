
-- Create reviews table for book reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Create notifications table for due date reminders
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circulation_id UUID REFERENCES public.circulation(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'due_reminder',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reader_stats table for tracking monthly reading statistics
CREATE TABLE public.reader_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  books_borrowed INTEGER DEFAULT 0,
  books_returned INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable RLS on new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reader_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can create notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'supervisor'))
);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reader_stats
CREATE POLICY "Users can view their own stats" ON public.reader_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all stats" ON public.reader_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'supervisor'))
);
CREATE POLICY "System can manage stats" ON public.reader_stats FOR ALL USING (true);

-- Function to update reader stats when circulation changes
CREATE OR REPLACE FUNCTION public.update_reader_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating reader stats
CREATE TRIGGER update_reader_stats_trigger
  AFTER INSERT OR UPDATE ON public.circulation
  FOR EACH ROW EXECUTE FUNCTION public.update_reader_stats();

-- Function to get top readers for a given month/year
CREATE OR REPLACE FUNCTION public.get_top_readers(
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  books_borrowed INTEGER,
  books_returned INTEGER,
  total_pages_read INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.user_id,
    p.full_name,
    p.email,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can borrow a book
CREATE OR REPLACE FUNCTION public.can_borrow_book(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS BOOLEAN AS $$
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
  
  -- Get max allowed books for user
  SELECT COALESCE(pt.max_books, 5) INTO max_allowed
  FROM public.patrons pt
  JOIN public.profiles p ON pt.email = p.email
  WHERE p.id = p_user_id;
  
  RETURN current_borrowed < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at column trigger for reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at column trigger for reader_stats
CREATE TRIGGER update_reader_stats_updated_at
  BEFORE UPDATE ON public.reader_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
