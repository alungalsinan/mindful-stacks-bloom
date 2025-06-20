
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Book, Users, Clock, Plus, BookOpen, User } from "lucide-react";

interface DashboardProps {
  searchQuery: string;
}

const Dashboard = ({ searchQuery }: DashboardProps) => {
  const stats = [
    {
      title: "Total Books",
      value: "12,847",
      change: "+2.5%",
      icon: Book,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Patrons",
      value: "3,421",
      change: "+8.1%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Books Checked Out",
      value: "1,256",
      change: "-1.2%",
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Overdue Items",
      value: "43",
      change: "-15.3%",
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const recentActivity = [
    { action: "Book returned", item: "The Great Gatsby", patron: "John Smith", time: "2 minutes ago" },
    { action: "New patron registered", item: "Maria Garcia", patron: "", time: "15 minutes ago" },
    { action: "Book checked out", item: "To Kill a Mockingbird", patron: "Sarah Johnson", time: "1 hour ago" },
    { action: "Fine paid", item: "$15.50", patron: "Michael Brown", time: "2 hours ago" },
    { action: "Book reserved", item: "1984", patron: "Emily Davis", time: "3 hours ago" }
  ];

  const popularBooks = [
    { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", checkouts: 45 },
    { title: "Where the Crawdads Sing", author: "Delia Owens", checkouts: 38 },
    { title: "Educated", author: "Tara Westover", checkouts: 32 },
    { title: "The Midnight Library", author: "Matt Haig", checkouts: 29 },
    { title: "Atomic Habits", author: "James Clear", checkouts: 27 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to LibraryOS</h2>
        <p className="text-blue-100 mb-4">
          Your next-generation library management system. Everything you need to manage your library efficiently.
        </p>
        <div className="flex space-x-3">
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
          <Button variant="outline" className="border-white text-white hover:bg-blue-600">
            <User className="h-4 w-4 mr-2" />
            Register Patron
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest transactions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">
                      {activity.item} {activity.patron && `• ${activity.patron}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Books */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <span>Popular Books</span>
            </CardTitle>
            <CardDescription>Most checked out books this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularBooks.map((book, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{book.title}</p>
                    <p className="text-sm text-slate-600">{book.author}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {book.checkouts} checkouts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system performance and resource usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Database Performance</span>
                <span className="text-slate-900 font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Server Uptime</span>
                <span className="text-slate-900 font-medium">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">API Response Time</span>
                <span className="text-slate-900 font-medium">142ms</span>
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
