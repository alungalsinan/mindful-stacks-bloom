
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Book {
  id: string;
  title: string;
  author_id: string;
  isbn: string;
  available_copies: number;
  total_copies: number;
  description: string;
  pages: number;
  publication_year: number;
  language: string;
  location: string;
  category_id: string;
  publisher_id: string;
  authors?: { name: string };
  categories?: { name: string };
  publishers?: { name: string };
}

interface Review {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  books: { title: string };
  profiles: { full_name: string };
}

interface Circulation {
  id: string;
  book_id: string;
  patron_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  books: { title: string };
  patrons: { full_name: string };
}

interface LibraryState {
  books: Book[];
  reviews: Review[];
  userCirculation: Circulation[];
  topReaders: any[];
  notifications: any[];
  loading: boolean;
  
  // Actions
  fetchBooks: () => Promise<void>;
  fetchUserReviews: (userId: string) => Promise<void>;
  fetchUserCirculation: (userId: string) => Promise<void>;
  fetchTopReaders: (month?: number, year?: number) => Promise<void>;
  borrowBook: (bookId: string, patronId: string) => Promise<boolean>;
  returnBook: (circulationId: string) => Promise<boolean>;
  addReview: (bookId: string, rating: number, comment: string) => Promise<boolean>;
  generateReport: (type: string) => Promise<Blob | null>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  reviews: [],
  userCirculation: [],
  topReaders: [],
  notifications: [],
  loading: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          authors(name),
          categories(name),
          publishers(name)
        `);
      
      if (error) throw error;
      set({ books: data || [] });
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchUserReviews: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          books(title),
          profiles(full_name)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      set({ reviews: data || [] });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  },

  fetchUserCirculation: async (userId: string) => {
    try {
      // Get patron ID from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!profile) return;

      const { data: patron } = await supabase
        .from('patrons')
        .select('id')
        .eq('email', profile.email)
        .single();
      
      if (!patron) return;

      const { data, error } = await supabase
        .from('circulation')
        .select(`
          *,
          books(title),
          patrons(full_name)
        `)
        .eq('patron_id', patron.id)
        .order('checkout_date', { ascending: false });
      
      if (error) throw error;
      set({ userCirculation: data || [] });
    } catch (error) {
      console.error('Error fetching circulation:', error);
    }
  },

  fetchTopReaders: async (month?: number, year?: number) => {
    try {
      const { data, error } = await supabase.rpc('get_top_readers', {
        p_month: month,
        p_year: year,
        p_limit: 10
      });
      
      if (error) throw error;
      set({ topReaders: data || [] });
    } catch (error) {
      console.error('Error fetching top readers:', error);
    }
  },

  borrowBook: async (bookId: string, patronId: string) => {
    try {
      // Check if user can borrow
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return false;

      const { data: canBorrow } = await supabase.rpc('can_borrow_book', {
        p_user_id: profile.user.id,
        p_book_id: bookId
      });

      if (!canBorrow) return false;

      // Create circulation record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks

      const { error } = await supabase
        .from('circulation')
        .insert({
          book_id: bookId,
          patron_id: patronId,
          due_date: dueDate.toISOString(),
          status: 'checked_out'
        });

      if (error) throw error;

      // Update available copies
      const { error: updateError } = await supabase.rpc('update_book_copies', {
        book_id: bookId,
        change: -1
      });

      if (updateError) throw updateError;

      // Refresh data
      get().fetchBooks();
      return true;
    } catch (error) {
      console.error('Error borrowing book:', error);
      return false;
    }
  },

  returnBook: async (circulationId: string) => {
    try {
      const { error } = await supabase
        .from('circulation')
        .update({
          return_date: new Date().toISOString(),
          status: 'returned'
        })
        .eq('id', circulationId);

      if (error) throw error;

      // Get book ID to update copies
      const { data: circulation } = await supabase
        .from('circulation')
        .select('book_id')
        .eq('id', circulationId)
        .single();

      if (circulation) {
        await supabase.rpc('update_book_copies', {
          book_id: circulation.book_id,
          change: 1
        });
      }

      return true;
    } catch (error) {
      console.error('Error returning book:', error);
      return false;
    }
  },

  addReview: async (bookId: string, rating: number, comment: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { error } = await supabase
        .from('reviews')
        .upsert({
          book_id: bookId,
          user_id: user.user.id,
          rating,
          comment
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      return false;
    }
  },

  generateReport: async (type: string) => {
    try {
      let data;
      let filename;
      
      switch (type) {
        case 'circulation':
          const { data: circData } = await supabase
            .from('circulation')
            .select(`
              *,
              books(title, authors(name)),
              patrons(full_name, email)
            `);
          data = circData;
          filename = 'circulation-report.json';
          break;
        
        case 'reviews':
          const { data: reviewData } = await supabase
            .from('reviews')
            .select(`
              *,
              books(title),
              profiles(full_name)
            `);
          data = reviewData;
          filename = 'reviews-report.json';
          break;
        
        default:
          return null;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      return blob;
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }
}));
