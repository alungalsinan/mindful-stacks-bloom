
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  available_copies: number;
  authors?: { name: string };
}

interface BorrowingInterfaceProps {
  book: Book;
  onBorrowSuccess?: () => void;
}

const BorrowingInterface = ({ book, onBorrowSuccess }: BorrowingInterfaceProps) => {
  const [borrowing, setBorrowing] = useState(false);
  const { user, profile } = useAuth();

  const handleBorrow = async () => {
    if (!user || !profile) {
      toast.error('Please log in to borrow books');
      return;
    }

    setBorrowing(true);
    try {
      // Check if user can borrow
      const { data: canBorrow } = await supabase.rpc('can_borrow_book', {
        p_user_id: user.id,
        p_book_id: book.id
      });

      if (!canBorrow) {
        toast.error('Cannot borrow this book. Check availability or your borrowing limit.');
        return;
      }

      // Get or create patron record
      let { data: patron } = await supabase
        .from('patrons')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (!patron) {
        // Create patron record
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
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks

      const { error: circError } = await supabase
        .from('circulation')
        .insert({
          book_id: book.id,
          patron_id: patron.id,
          due_date: dueDate.toISOString(),
          status: 'checked_out',
          checked_out_by: user.id
        });

      if (circError) throw circError;

      // Update book available copies
      const { error: updateError } = await supabase
        .from('books')
        .update({
          available_copies: book.available_copies - 1
        })
        .eq('id', book.id);

      if (updateError) throw updateError;

      toast.success(`Successfully borrowed "${book.title}"! Due date: ${dueDate.toLocaleDateString()}`);
      onBorrowSuccess?.();
    } catch (error) {
      console.error('Error borrowing book:', error);
      toast.error('Failed to borrow book');
    } finally {
      setBorrowing(false);
    }
  };

  const isAvailable = book.available_copies > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Borrow Book</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Availability:</span>
          <Badge variant={isAvailable ? "default" : "destructive"}>
            {book.available_copies} available
          </Badge>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Loan period: 14 days</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Can be renewed once</span>
        </div>

        {profile?.role === 'student' && (
          <Button
            onClick={handleBorrow}
            disabled={!isAvailable || borrowing}
            className="w-full"
          >
            {borrowing ? (
              'Borrowing...'
            ) : isAvailable ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Borrow Book
              </>
            ) : (
              'Not Available'
            )}
          </Button>
        )}

        {profile?.role !== 'student' && (
          <p className="text-sm text-gray-500 text-center">
            Only students can borrow books
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BorrowingInterface;
