
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Book, Plus, Eye, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BookReviews from "./BookReviews";
import BorrowingInterface from "./BorrowingInterface";

interface Book {
  id: string;
  title: string;
  isbn: string;
  description: string;
  pages: number;
  publication_year: number;
  language: string;
  location: string;
  available_copies: number;
  total_copies: number;
  authors: { name: string } | null;
  categories: { name: string } | null;
  publishers: { name: string } | null;
  avg_rating?: number;
  review_count?: number;
}

interface BookCatalogProps {
  searchQuery: string;
  userRole: string;
}

const BookCatalog = ({ searchQuery, userRole }: BookCatalogProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  const fetchBooks = async () => {
    try {
      // First, get books with basic info
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          authors(name),
          categories(name),
          publishers(name)
        `)
        .order('title');

      if (booksError) throw booksError;

      // Then get review statistics for each book
      const booksWithReviews = await Promise.all(
        (booksData || []).map(async (book) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('book_id', book.id);

          const reviewCount = reviews?.length || 0;
          const avgRating = reviewCount > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
            : 0;

          return {
            ...book,
            review_count: reviewCount,
            avg_rating: Math.round(avgRating * 10) / 10
          };
        })
      );

      setBooks(booksWithReviews);
      setFilteredBooks(booksWithReviews);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowSuccess = () => {
    fetchBooks(); // Refresh books to update available copies
    setSelectedBook(null); // Close dialog
  };

  const StarRating = ({ rating, count }: { rating: number; count: number }) => (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {rating > 0 ? `${rating} (${count})` : 'No reviews'}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Book className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Book Catalog</h2>
        </div>

        {(userRole === 'staff' || userRole === 'supervisor') && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Found {filteredBooks.length} book(s) matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="line-clamp-2">{book.title}</CardTitle>
              <CardDescription>
                {book.authors?.name && `by ${book.authors.name}`}
                {book.publication_year && ` • ${book.publication_year}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Book Info */}
              <div className="space-y-2">
                {book.isbn && (
                  <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
                )}
                {book.categories?.name && (
                  <Badge variant="secondary">{book.categories.name}</Badge>
                )}
              </div>

              {/* Rating */}
              <StarRating rating={book.avg_rating || 0} count={book.review_count || 0} />

              {/* Availability */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Availability:</span>
                <Badge variant={book.available_copies > 0 ? "default" : "destructive"}>
                  {book.available_copies}/{book.total_copies} available
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedBook(book)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{book.title}</DialogTitle>
                    </DialogHeader>
                    
                    {selectedBook && (
                      <Tabs defaultValue="details" className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="reviews">Reviews</TabsTrigger>
                          {userRole === 'student' && (
                            <TabsTrigger value="borrow">Borrow</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold">Book Information</h3>
                                <div className="mt-2 space-y-2 text-sm">
                                  <p><span className="font-medium">Author:</span> {selectedBook.authors?.name || 'Unknown'}</p>
                                  <p><span className="font-medium">Publisher:</span> {selectedBook.publishers?.name || 'Unknown'}</p>
                                  <p><span className="font-medium">Category:</span> {selectedBook.categories?.name || 'Uncategorized'}</p>
                                  <p><span className="font-medium">Language:</span> {selectedBook.language || 'Unknown'}</p>
                                  <p><span className="font-medium">Pages:</span> {selectedBook.pages || 'Unknown'}</p>
                                  <p><span className="font-medium">Location:</span> {selectedBook.location || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold">Description</h3>
                              <p className="mt-2 text-sm text-gray-600">
                                {selectedBook.description || 'No description available.'}
                              </p>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="reviews">
                          <BookReviews bookId={selectedBook.id} userRole={userRole} />
                        </TabsContent>

                        {userRole === 'student' && (
                          <TabsContent value="borrow">
                            <BorrowingInterface 
                              book={selectedBook} 
                              onBorrowSuccess={handleBorrowSuccess}
                            />
                          </TabsContent>
                        )}
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">
              {searchQuery ? 'No books found matching your search.' : 'No books available.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookCatalog;
