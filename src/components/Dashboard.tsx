
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Users, Calendar, Clock, TrendingUp, Star, Award } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { supabase } from "@/integrations/supabase/client";
import MyBorrowings from "./MyBorrowings";
import TopReaders from "./TopReaders";
import ReportGenerator from "./ReportGenerator";

interface DashboardProps {
  searchQuery: string;
  userRole: string;
}

const Dashboard = ({ searchQuery, userRole }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalPatrons: 0,
    activeLoans: 0,
    overdueBooks: 0,
    totalReviews: 0,
    averageRating: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useCustomAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [booksRes, patronsRes, circulationRes, overdueRes, reviewsRes] = await Promise.all([
        supabase.from('books').select('id, available_copies, total_copies'),
        supabase.from('patrons').select('id'),
        supabase.from('circulation').select('id').eq('status', 'checked_out'),
        supabase.from('circulation').select('id').eq('status', 'checked_out').lt('due_date', new Date().toISOString()),
        supabase.from('reviews').select('rating')
      ]);

      const books = booksRes.data || [];
      const totalBooks = books.reduce((sum, book) => sum + (book.total_copies || 0), 0);
      const availableBooks = books.reduce((sum, book) => sum + (book.available_copies || 0), 0);
      const totalReviews = reviewsRes.data?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviewsRes.data.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      setStats({
        totalBooks,
        availableBooks,
        totalPatrons: patronsRes.data?.length || 0,
        activeLoans: circulationRes.data?.length || 0,
        overdueBooks: overdueRes.data?.length || 0,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10
      });

      // Fetch recent activity (circulation records)
      if (userRole !== 'student') {
        const { data: activity } = await supabase
          .from('circulation')
          .select(`
            id,
            checkout_date,
            return_date,
            status,
            books(title),
            patrons(full_name)
          `)
          .order('checkout_date', { ascending: false })
          .limit(10);

        setRecentActivity(activity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600">
            {userRole === 'student' && "Discover and borrow your next favorite book"}
            {userRole === 'staff' && "Manage library operations and assist patrons"}
            {userRole === 'supervisor' && "Oversee library operations and view reports"}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableBooks} available
            </p>
          </CardContent>
        </Card>

        {userRole !== 'student' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patrons</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatrons}</div>
                <p className="text-xs text-muted-foreground">
                  Registered members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeLoans}</div>
                <p className="text-xs text-muted-foreground">
                  Currently borrowed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdueBooks}</div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {userRole === 'student' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Book Reviews</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <p className="text-xs text-muted-foreground">
                  Average: {stats.averageRating}/5 stars
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.availableBooks}</div>
                <p className="text-xs text-muted-foreground">
                  Ready to borrow
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reading Stats</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Role-specific Content */}
      <Tabs defaultValue={userRole === 'student' ? 'borrowings' : 'activity'} className="space-y-4">
        <TabsList>
          {userRole === 'student' && (
            <>
              <TabsTrigger value="borrowings">My Borrowings</TabsTrigger>
              <TabsTrigger value="readers">Top Readers</TabsTrigger>
            </>
          )}
          
          {userRole !== 'student' && (
            <>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="readers">Top Readers</TabsTrigger>
              {userRole === 'supervisor' && (
                <TabsTrigger value="reports">Reports</TabsTrigger>
              )}
            </>
          )}
        </TabsList>

        {userRole === 'student' && (
          <>
            <TabsContent value="borrowings">
              <MyBorrowings />
            </TabsContent>

            <TabsContent value="readers">
              <TopReaders />
            </TabsContent>
          </>
        )}

        {userRole !== 'student' && (
          <>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest library transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 10).map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{activity.books?.title}</p>
                            <p className="text-sm text-gray-600">
                              {activity.status === 'checked_out' ? 'Borrowed' : 'Returned'} by {activity.patrons?.full_name}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(activity.checkout_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="readers">
              <TopReaders />
            </TabsContent>

            {userRole === 'supervisor' && (
              <TabsContent value="reports">
                <ReportGenerator />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;
