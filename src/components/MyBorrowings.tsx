
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Calendar, Clock, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { toast } from 'sonner';

interface Circulation {
  id: string;
  book_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  renewed_count: number;
  books: {
    title: string;
    authors: { name: string } | null;
  };
}

const MyBorrowings = () => {
  const [circulations, setCirculations] = useState<Circulation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useCustomAuth();

  useEffect(() => {
    if (user) {
      fetchUserBorrowings();
    }
  }, [user]);

  const fetchUserBorrowings = async () => {
    if (!user) return;

    try {
      // Get patron record by user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: patron } = await supabase
        .from('patrons')
        .select('id')
        .eq('email', profile.email || `${user.username}@library.local`)
        .maybeSingle();

      if (!patron) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('circulation')
        .select(`
          *,
          books(
            title,
            authors(name)
          )
        `)
        .eq('patron_id', patron.id)
        .order('checkout_date', { ascending: false });

      if (error) throw error;
      setCirculations(data || []);
    } catch (error) {
      console.error('Error fetching borrowings:', error);
      toast.error('Failed to load borrowings');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (circulationId: string, bookId: string) => {
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

      // Get current book data to update available copies
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_copies')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;

      // Update available copies
      const { error: updateError } = await supabase
        .from('books')
        .update({
          available_copies: (book.available_copies || 0) + 1
        })
        .eq('id', bookId);

      if (updateError) throw updateError;

      toast.success('Book returned successfully!');
      fetchUserBorrowings();
    } catch (error) {
      console.error('Error returning book:', error);
      toast.error('Failed to return book');
    }
  };

  const handleRenew = async (circulationId: string, currentDueDate: string) => {
    try {
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + 14); // Extend by 2 weeks

      const { error } = await supabase
        .from('circulation')
        .update({
          due_date: newDueDate.toISOString(),
          renewed_count: 1
        })
        .eq('id', circulationId);

      if (error) throw error;

      toast.success('Book renewed successfully!');
      fetchUserBorrowings();
    } catch (error) {
      console.error('Error renewing book:', error);
      toast.error('Failed to renew book');
    }
  };

  const currentBorrowings = circulations.filter(c => c.status === 'checked_out');
  const borrowingHistory = circulations.filter(c => c.status === 'returned');

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const canRenew = (circulation: Circulation) => {
    return circulation.renewed_count === 0 && !isOverdue(circulation.due_date);
  };

  if (loading) {
    return <div className="text-center">Loading your borrowings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Book className="h-6 w-6" />
        <h2 className="text-2xl font-bold">My Borrowings</h2>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">
            Current Borrowings ({currentBorrowings.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({borrowingHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentBorrowings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No current borrowings</p>
              </CardContent>
            </Card>
          ) : (
            currentBorrowings.map((circulation) => (
              <Card key={circulation.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{circulation.books.title}</span>
                    <Badge 
                      variant={isOverdue(circulation.due_date) ? "destructive" : "default"}
                    >
                      {isOverdue(circulation.due_date) ? "Overdue" : "Active"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Borrowed: {new Date(circulation.checkout_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className={isOverdue(circulation.due_date) ? "text-red-600" : ""}>
                        Due: {new Date(circulation.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(circulation.id, circulation.book_id)}
                    >
                      Return Book
                    </Button>
                    
                    {canRenew(circulation) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRenew(circulation.id, circulation.due_date)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Renew
                      </Button>
                    )}
                    
                    {circulation.renewed_count > 0 && (
                      <Badge variant="secondary">Renewed</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {borrowingHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No borrowing history</p>
              </CardContent>
            </Card>
          ) : (
            borrowingHistory.map((circulation) => (
              <Card key={circulation.id}>
                <CardHeader>
                  <CardTitle>{circulation.books.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Borrowed: {new Date(circulation.checkout_date).toLocaleDateString()}</div>
                    <div>Due: {new Date(circulation.due_date).toLocaleDateString()}</div>
                    <div>Returned: {circulation.return_date ? new Date(circulation.return_date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBorrowings;
