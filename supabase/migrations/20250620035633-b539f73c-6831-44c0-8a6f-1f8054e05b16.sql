
-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('supervisor', 'staff', 'student');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table for book classification
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publishers table
CREATE TABLE public.publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  isbn TEXT UNIQUE,
  author_id UUID REFERENCES public.authors(id),
  publisher_id UUID REFERENCES public.publishers(id),
  category_id UUID REFERENCES public.categories(id),
  publication_year INTEGER,
  pages INTEGER,
  language TEXT DEFAULT 'English',
  description TEXT,
  location TEXT, -- shelf location
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patrons table
CREATE TABLE public.patrons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_id TEXT UNIQUE NOT NULL, -- library card number
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  patron_type TEXT DEFAULT 'Student', -- Adult, Student, Child, Faculty, etc.
  membership_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'Active', -- Active, Suspended, Expired
  max_books INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create circulation transactions table
CREATE TABLE public.circulation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) NOT NULL,
  patron_id UUID REFERENCES public.patrons(id) NOT NULL,
  checked_out_by UUID REFERENCES public.profiles(id), -- staff member who processed
  checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  renewed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'checked_out', -- checked_out, returned, overdue
  fine_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) NOT NULL,
  patron_id UUID REFERENCES public.patrons(id) NOT NULL,
  reserved_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'waiting', -- waiting, available, expired, fulfilled
  priority INTEGER DEFAULT 1,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fines table
CREATE TABLE public.fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circulation_id UUID REFERENCES public.circulation(id),
  patron_id UUID REFERENCES public.patrons(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'unpaid', -- unpaid, paid, waived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is staff or supervisor
CREATE OR REPLACE FUNCTION public.is_staff_or_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role IN ('staff', 'supervisor')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Supervisors can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Supervisors can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- RLS Policies for books (students can only view, staff can manage, supervisors can do everything)
CREATE POLICY "Everyone can view books" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Staff and supervisors can manage books" ON public.books
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- RLS Policies for authors, publishers, categories (same as books)
CREATE POLICY "Everyone can view authors" ON public.authors
  FOR SELECT USING (true);

CREATE POLICY "Staff and supervisors can manage authors" ON public.authors
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Everyone can view publishers" ON public.publishers
  FOR SELECT USING (true);

CREATE POLICY "Staff and supervisors can manage publishers" ON public.publishers
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Staff and supervisors can manage categories" ON public.categories
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- RLS Policies for patrons
CREATE POLICY "Staff and supervisors can view all patrons" ON public.patrons
  FOR SELECT USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Staff and supervisors can manage patrons" ON public.patrons
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- RLS Policies for circulation (only staff and supervisors)
CREATE POLICY "Staff and supervisors can view circulation" ON public.circulation
  FOR SELECT USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Staff and supervisors can manage circulation" ON public.circulation
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- RLS Policies for reservations
CREATE POLICY "Staff and supervisors can view reservations" ON public.reservations
  FOR SELECT USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Staff and supervisors can manage reservations" ON public.reservations
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- RLS Policies for fines
CREATE POLICY "Staff and supervisors can view fines" ON public.fines
  FOR SELECT USING (public.is_staff_or_supervisor(auth.uid()));

CREATE POLICY "Staff and supervisors can manage fines" ON public.fines
  FOR ALL USING (public.is_staff_or_supervisor(auth.uid()));

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patrons_updated_at BEFORE UPDATE ON public.patrons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'student'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data
INSERT INTO public.categories (name, description) VALUES
  ('Fiction', 'Fictional literature and novels'),
  ('Non-Fiction', 'Factual and informational books'),
  ('Science', 'Scientific and technical books'),
  ('History', 'Historical books and documentaries'),
  ('Biography', 'Biographical accounts'),
  ('Technology', 'Computer science and technology books');

INSERT INTO public.authors (name, bio) VALUES
  ('J.K. Rowling', 'British author, best known for Harry Potter series'),
  ('George Orwell', 'English novelist and essayist'),
  ('Agatha Christie', 'English writer known for detective novels'),
  ('Stephen King', 'American author of horror and supernatural fiction');

INSERT INTO public.publishers (name, address, contact_info) VALUES
  ('Penguin Random House', 'New York, NY', 'contact@penguinrandomhouse.com'),
  ('HarperCollins', 'New York, NY', 'info@harpercollins.com'),
  ('Simon & Schuster', 'New York, NY', 'contact@simonandschuster.com');
