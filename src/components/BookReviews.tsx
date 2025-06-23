
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string };
}

interface BookReviewsProps {
  bookId: string;
  userRole: string;
}

const BookReviews = ({ bookId, userRole }: BookReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReviews(data || []);
      
      // Check if current user has reviewed
      if (user) {
        const existing = data?.find(r => r.user_id === user.id);
        setUserReview(existing || null);
        if (existing) {
          setNewRating(existing.rating);
          setNewComment(existing.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const submitReview = async () => {
    if (!user || !newRating) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          rating: newRating,
          comment: newComment || null
        });

      if (error) throw error;

      toast.success(userReview ? 'Review updated!' : 'Review added!');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const StarRating = ({ rating, interactive = false, onRatingChange }: any) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={interactive ? () => onRatingChange(star) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Reviews ({reviews.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="flex items-center space-x-4">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-lg font-semibold">
                {averageRating.toFixed(1)} out of 5
              </span>
              <span className="text-gray-600">
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <p className="text-gray-600">No reviews yet</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Review Form (for students) */}
      {userRole === 'student' && user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <StarRating 
                rating={newRating} 
                interactive 
                onRatingChange={setNewRating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment (optional)</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this book..."
                rows={4}
              />
            </div>
            <Button 
              onClick={submitReview}
              disabled={!newRating || submitting}
            >
              {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <StarRating rating={review.rating} />
                    <span className="font-medium">{review.profiles.full_name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookReviews;
