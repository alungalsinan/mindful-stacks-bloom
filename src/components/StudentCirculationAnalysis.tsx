import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Book, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  BarChart3,
  BookOpen,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { toast } from 'sonner';

interface CirculationStats {
  totalBorrowed: number;
  currentlyBorrowed: number;
  booksReturned: number;
  overdueBooks: number;
  totalPagesRead: number;
  averageReadingTime: number;
  favoriteGenres: string[];
  monthlyStats: {
    month: string;
    borrowed: number;
    returned: number;
    pagesRead: number;
  }[];
}

const StudentCirculationAnalysis = () => {
  const [stats, setStats] = useState<CirculationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useCustomAuth();

  useEffect(() => {
    if (user) {
      fetchAnalysisData();
    }
  }, [user]);

  const fetchAnalysisData = async () => {
    if (!user) return;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Get patron record
      const { data: patron } = await supabase
        .from('patrons')
        .select('id')
        .eq('email', profile.email || `${user.username}@library.local`)
        .maybeSingle();

      if (!patron) {
        setStats({
          totalBorrowed: 0,
          currentlyBorrowed: 0,
          booksReturned: 0,
          overdueBooks: 0,
          totalPagesRead: 0,
          averageReadingTime: 0,
          favoriteGenres: [],
          monthlyStats: []
        });
        setLoading(false);
        return;
      }

      // Get circulation data
      const { data: circulations } = await supabase
        .from('circulation')
        .select(`
          *,
          books(
            title,
            pages,
            categories(name)
          )
        `)
        .eq('patron_id', patron.id);

      // Get reader stats
      const { data: readerStats } = await supabase
        .from('reader_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (circulations) {
        const currentDate = new Date();
        const currentlyBorrowed = circulations.filter(c => c.status === 'checked_out').length;
        const booksReturned = circulations.filter(c => c.status === 'returned').length;
        const overdueBooks = circulations.filter(c => 
          c.status === 'checked_out' && new Date(c.due_date) < currentDate
        ).length;

        // Calculate total pages read
        const totalPagesRead = circulations
          .filter(c => c.status === 'returned')
          .reduce((total, c) => total + (c.books?.pages || 0), 0);

        // Calculate average reading time (days between checkout and return)
        const returnedBooks = circulations.filter(c => c.status === 'returned' && c.return_date);
        const totalReadingDays = returnedBooks.reduce((total, c) => {
          const checkoutDate = new Date(c.checkout_date);
          const returnDate = new Date(c.return_date!);
          const days = Math.ceil((returnDate.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60 * 24));
          return total + days;
        }, 0);
        const averageReadingTime = returnedBooks.length > 0 ? Math.round(totalReadingDays / returnedBooks.length) : 0;

        // Get favorite genres
        const genreCounts: { [key: string]: number } = {};
        circulations.forEach(c => {
          if (c.books?.categories?.name) {
            genreCounts[c.books.categories.name] = (genreCounts[c.books.categories.name] || 0) + 1;
          }
        });
        const favoriteGenres = Object.entries(genreCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([genre]) => genre);

        // Format monthly stats
        const monthlyStats = readerStats?.map(stat => ({
          month: `${stat.year}-${stat.month.toString().padStart(2, '0')}`,
          borrowed: stat.books_borrowed || 0,
          returned: stat.books_returned || 0,
          pagesRead: stat.total_pages_read || 0
        })) || [];

        setStats({
          totalBorrowed: circulations.length,
          currentlyBorrowed,
          booksReturned,
          overdueBooks,
          totalPagesRead,
          averageReadingTime,
          favoriteGenres,
          monthlyStats
        });
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast.error('Failed to load circulation analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading circulation analysis...</div>;
  }

  if (!stats) {
    return <div className="text-center">No circulation data available</div>;
  }

  const readingGoalProgress = Math.min((stats.totalPagesRead / 10000) * 100, 100);
  const borrowingEfficiency = stats.totalBorrowed > 0 ? (stats.booksReturned / stats.totalBorrowed) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">My Reading Analytics</h2>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Book className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Borrowed</p>
                <p className="text-2xl font-bold">{stats.totalBorrowed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Currently Reading</p>
                <p className="text-2xl font-bold">{stats.currentlyBorrowed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Books Completed</p>
                <p className="text-2xl font-bold">{stats.booksReturned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pages Read</p>
                <p className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reading Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Reading Goal Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Annual Reading Goal: 10,000 pages</span>
                <span>{readingGoalProgress.toFixed(1)}%</span>
              </div>
              <Progress value={readingGoalProgress} className="h-2" />
            </div>
            <p className="text-sm text-gray-600">
              {stats.totalPagesRead} pages read of 10,000 goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reading Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Books Returned vs Borrowed</span>
                <span>{borrowingEfficiency.toFixed(1)}%</span>
              </div>
              <Progress value={borrowingEfficiency} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Avg. Reading Time</p>
                <p className="font-semibold">{stats.averageReadingTime} days</p>
              </div>
              <div>
                <p className="text-gray-600">Overdue Books</p>
                <p className="font-semibold text-red-600">{stats.overdueBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Favorite Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteGenres.length > 0 ? (
              stats.favoriteGenres.map((genre, index) => (
                <Badge key={genre} variant={index === 0 ? "default" : "secondary"}>
                  {genre}
                </Badge>
              ))
            ) : (
              <p className="text-gray-600">No genre data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Reading Activity */}
      {stats.monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Reading Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthlyStats.slice(-6).map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{month.month}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Borrowed</p>
                      <p className="font-semibold">{month.borrowed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Returned</p>
                      <p className="font-semibold">{month.returned}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Pages</p>
                      <p className="font-semibold">{month.pagesRead.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={fetchAnalysisData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default StudentCirculationAnalysis;