
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Book, Users, Clock, Plus, BookOpen, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  searchQuery: string;
  userRole: string;
}

const Dashboard = ({ searchQuery, userRole }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalPatrons: 0,
    checkedOutBooks: 0,
    overdueItems: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [popularBooks, setPopularBooks] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchPopularBooks();
  }, []);

  const fetchStats = async () => {
    try {
      const [booksCount, patronsCount, circulationCount] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('patrons').select('*', { count: 'exact', head: true }),
        supabase.from('circulation').select('*', { count: 'exact', head: true }).eq('status', 'checked_out'),
      ]);

      setStats({
        totalBooks: booksCount.count || 0,
        totalPatrons: patronsCount.count || 0,
        checkedOutBooks: circulationCount.count || 0,
        overdueItems: 0, // TODO: Calculate overdue items
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('circulation')
        .select(`
          *,
          books(title),
          patrons(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchPopularBooks = async () => {
    try {
      const { data } = await supabase
        .from('books')
        .select(`
          *,
          authors(name)
        `)
        .order('total_copies', { ascending: false })
        .limit(5);

      setPopularBooks(data || []);
    } catch (error) {
      console.error('Error fetching popular books:', error);
    }
  };

  const statsData = [
    {
      title: "Total Books",
      value: stats.totalBooks.toLocaleString(),
      change: "+2.5%",
      icon: Book,
      color: "text-gray-700",
      bgColor: "bg-gray-100"
    },
    {
      title: "Active Patrons",
      value: stats.totalPatrons.toLocaleString(),
      change: "+8.1%",
      icon: Users,
      color: "text-gray-700",
      bgColor: "bg-gray-100"
    },
    {
      title: "Books Checked Out",
      value: stats.checkedOutBooks.toLocaleString(),
      change: "-1.2%",
      icon: BookOpen,
      color: "text-gray-700",
      bgColor: "bg-gray-100"
    },
    {
      title: "Overdue Items",
      value: stats.overdueItems.toString(),
      change: "-15.3%",
      icon: Clock,
      color: "text-gray-700",
      bgColor: "bg-gray-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Al Gazzali Library System</h2>
        <p className="text-gray-200 mb-4">
          Professional library management system for efficient operations and patron services.
        </p>
        <div className="flex space-x-3">
          {(userRole === 'staff' || userRole === 'supervisor') && (
            <>
              <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-gray-800">
                <User className="h-4 w-4 mr-2" />
                Register Patron
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-gray-700' : 'text-gray-500'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest transactions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Book {activity.status === 'checked_out' ? 'checked out' : 'returned'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.books?.title} • {activity.patrons?.full_name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Books */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              <span>Book Collection</span>
            </CardTitle>
            <CardDescription>Recently added books in the catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularBooks.map((book, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                    <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.authors?.name || 'Unknown Author'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
                      {book.total_copies} copies
                    </Badge>
                  </div>
                </div>
              ))}
              {popularBooks.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No books available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system performance and resource usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database Performance</span>
                <span className="text-gray-900 font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Server Uptime</span>
                <span className="text-gray-900 font-medium">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Response Time</span>
                <span className="text-gray-900 font-medium">142ms</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
