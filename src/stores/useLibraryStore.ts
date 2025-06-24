
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  isbn?: string;
  available_copies: number;
  total_copies: number;
  authors?: { name: string };
  categories?: { name: string };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_id: string;
  books?: { title: string };
  profiles?: { full_name: string };
}

interface Circulation {
  id: string;
  book_id: string;
  patron_id: string;
  checkout_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  books?: { title: string };
  patrons?: { full_name: string };
}

interface LibraryState {
  books: Book[];
  reviews: Review[];
  circulation: Circulation[];
  loading: boolean;
  
  // Actions
  fetchBooks: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  fetchCirculation: () => Promise<void>;
  borrowBook: (bookId: string, userId: string) => Promise<boolean>;
  returnBook: (circulationId: string, bookId: string) => Promise<boolean>;
  addReview: (bookId: string, userId: string, rating: number, comment?: string) => Promise<boolean>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  reviews: [],
  circulation: [],
  loading: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          authors(name),
          categories(name)
        `)
        .order('title');

      if (error) throw error;
      set({ books: data || [] });
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books');
    } finally {
      set({ loading: false });
    }
  },

  fetchReviews: async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          books(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            profiles: profile || { full_name: 'Anonymous' }
          };
        })
      );

      set({ reviews: reviewsWithProfiles });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    }
  },

  fetchCirculation: async () => {
    try {
      const { data, error } = await supabase
        .from('circulation')
        .select(`
          *,
          books(title),
          patrons(full_name)
        `)
        .order('checkout_date', { ascending: false });

      if (error) throw error;
      set({ circulation: data || [] });
    } catch (error) {
      console.error('Error fetching circulation:', error);
      toast.error('Failed to fetch circulation data');
    }
  },

  borrowBook: async (bookId: string, userId: string) => {
    try {
      // Check if user can borrow
      const { data: canBorrow } = await supabase.rpc('can_borrow_book', {
        p_user_id: userId,
        p_book_id: bookId
      });

      if (!canBorrow) {
        toast.error('Cannot borrow this book. Check availability or your borrowing limit.');
        return false;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!profile) throw new Error('User profile not found');

      // Get or create patron record
      let { data: patron } = await supabase
        .from('patrons')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (!patron) {
        const { data: newPatron, error: patronError } = await supabase
          .from('patrons')
          .insert({
            patron_id: `P${Date.now()}`,
            full_name: profile.full_name,
            email: profile.email,
            patron_type: 'Student',
            status: 'Active'
          })
          .select('id')
          .single();

        if (patronError) throw patronError;
        patron = newPatron;
      }

      // Create circulation record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { error: circError } = await supabase
        .from('circulation')
        .insert({
          book_id: bookId,
          patron_id: patron.id,
          due_date: dueDate.toISOString(),
          status: 'checked_out',
          checked_out_by: userId
        });

      if (circError) throw circError;

      // Update book available copies manually
      const book = get().books.find(b => b.id === bookId);
      if (book && book.available_copies > 0) {
        const { error: updateError } = await supabase
          .from('books')
          .update({ available_copies: book.available_copies - 1 })
          .eq('id', bookId);

        if (updateError) throw updateError;

        // Update local state
        set({
          books: get().books.map(b => 
            b.id === bookId 
              ? { ...b, available_copies: b.available_copies - 1 }
              : b
          )
        });
      }

      toast.success('Book borrowed successfully!');
      return true;
    } catch (error) {
      console.error('Error borrowing book:', error);
      toast.error('Failed to borrow book');
      return false;
    }
  },

  returnBook: async (circulationId: string, bookId: string) => {
    try {
      // Update circulation status
      const { error: circError } = await supabase
        .from('circulation')
        .update({
          return_date: new Date().toISOString(),
          status: 'returned'
        })
        .eq('id', circulationId);

      if (circError) throw circError;

      // Update book available copies manually
      const book = get().books.find(b => b.id === bookId);
      if (book) {
        const { error: updateError } = await supabase
          .from('books')
          .update({ available_copies: book.available_copies + 1 })
          .eq('id', bookId);

        if (updateError) throw updateError;

        // Update local state
        set({
          books: get().books.map(b => 
            b.id === bookId 
              ? { ...b, available_copies: b.available_copies + 1 }
              : b
          )
        });
      }

      toast.success('Book returned successfully!');
      return true;
    } catch (error) {
      console.error('Error returning book:', error);
      toast.error('Failed to return book');
      return false;
    }
  },

  addReview: async (bookId: string, userId: string, rating: number, comment?: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          book_id: bookId,
          user_id: userId,
          rating,
          comment: comment || null
        });

      if (error) throw error;

      toast.success('Review added successfully!');
      get().fetchReviews(); // Refresh reviews
      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
      return false;
    }
  }
}));
