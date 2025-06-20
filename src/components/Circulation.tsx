
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Search, BookOpen, User, Calendar, Plus } from "lucide-react";

interface CirculationProps {
  searchQuery: string;
}

const Circulation = ({ searchQuery }: CirculationProps) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("checkouts");

  const checkouts = [
    {
      id: "1",
      patronName: "John Smith",
      bookTitle: "The Seven Husbands of Evelyn Hugo",
      isbn: "978-1501161933",
      checkoutDate: "2024-06-15",
      dueDate: "2024-06-29",
      status: "Checked Out",
      renewals: 0,
      maxRenewals: 2
    },
    {
      id: "2",
      patronName: "Sarah Johnson",
      bookTitle: "Where the Crawdads Sing",
      isbn: "978-0735219090",
      checkoutDate: "2024-06-10",
      dueDate: "2024-06-24",
      status: "Overdue",
      renewals: 1,
      maxRenewals: 2,
      daysOverdue: 3
    },
    {
      id: "3",
      patronName: "Emily Davis",
      bookTitle: "The Midnight Library",
      isbn: "978-0525559474",
      checkoutDate: "2024-06-18",
      dueDate: "2024-07-02",
      status: "Checked Out",
      renewals: 0,
      maxRenewals: 2
    },
    {
      id: "4",
      patronName: "Robert Wilson",
      bookTitle: "Atomic Habits",
      isbn: "978-0735211292",
      checkoutDate: "2024-06-12",
      dueDate: "2024-06-26",
      status: "Due Soon",
      renewals: 2,
      maxRenewals: 2,
      daysUntilDue: 1
    }
  ];

  const reservations = [
    {
      id: "1",
      patronName: "Maria Garcia",
      bookTitle: "Where the Crawdads Sing",
      isbn: "978-0735219090",
      reservedDate: "2024-06-20",
      position: 1,
      status: "Available for Pickup",
      expiresDate: "2024-06-27"
    },
    {
      id: "2",
      patronName: "Michael Brown",
      bookTitle: "The Seven Husbands of Evelyn Hugo",
      isbn: "978-1501161933",
      reservedDate: "2024-06-19",
      position: 2,
      status: "Waiting",
      estimatedDate: "2024-07-05"
    }
  ];

  const filteredTransactions = checkouts.filter(checkout => {
    const matchesSearch = searchQuery === "" || 
      checkout.patronName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkout.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkout.isbn.includes(searchQuery);
    
    const matchesStatus = filterStatus === "all" || checkout.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Checked Out": return "bg-blue-100 text-blue-800";
      case "Overdue": return "bg-red-100 text-red-800";
      case "Due Soon": return "bg-yellow-100 text-yellow-800";
      case "Available for Pickup": return "bg-green-100 text-green-800";
      case "Waiting": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Circulation</h2>
          <p className="text-slate-600">Manage checkouts, returns, and reservations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Quick Checkout
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Total Checkouts</p>
                <p className="text-2xl font-bold">1,256</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-600">Overdue Items</p>
                <p className="text-2xl font-bold">43</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-slate-600">Due Today</p>
                <p className="text-2xl font-bold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Reservations</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "checkouts" 
              ? "bg-white text-slate-900 shadow" 
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("checkouts")}
        >
          Current Checkouts
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "reservations" 
              ? "bg-white text-slate-900 shadow" 
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("reservations")}
        >
          Reservations
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by patron, book, or ISBN..."
                  className="pl-10"
                  defaultValue={searchQuery}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Due Soon">Due Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date Range</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "checkouts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              Showing {filteredTransactions.length} of {checkouts.length} checkouts
            </p>
          </div>

          <div className="space-y-4">
            {filteredTransactions.map((checkout) => (
              <Card key={checkout.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{checkout.patronName}</p>
                        <p className="text-sm text-slate-600">Patron</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{checkout.bookTitle}</p>
                        <p className="text-sm text-slate-600 font-mono">{checkout.isbn}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Due: {new Date(checkout.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          Checked out: {new Date(checkout.checkoutDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Renewals: {checkout.renewals}/{checkout.maxRenewals}
                        </p>
                        {checkout.status === "Overdue" && checkout.daysOverdue && (
                          <p className="text-sm text-red-600 font-semibold">
                            {checkout.daysOverdue} days overdue
                          </p>
                        )}
                        {checkout.status === "Due Soon" && checkout.daysUntilDue && (
                          <p className="text-sm text-yellow-600 font-semibold">
                            Due in {checkout.daysUntilDue} day{checkout.daysUntilDue > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <Badge variant="secondary" className={getStatusColor(checkout.status)}>
                        {checkout.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Return
                        </Button>
                        {checkout.renewals < checkout.maxRenewals && (
                          <Button variant="outline" size="sm">
                            Renew
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              Showing {reservations.length} reservations
            </p>
          </div>

          <div className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{reservation.patronName}</p>
                        <p className="text-sm text-slate-600">Patron</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{reservation.bookTitle}</p>
                        <p className="text-sm text-slate-600 font-mono">{reservation.isbn}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Reserved: {new Date(reservation.reservedDate).toLocaleDateString()}
                        </p>
                        {reservation.position && (
                          <p className="text-sm text-slate-600">
                            Position: #{reservation.position} in queue
                          </p>
                        )}
                      </div>
                      <div>
                        {reservation.expiresDate && (
                          <p className="text-sm text-slate-600">
                            Expires: {new Date(reservation.expiresDate).toLocaleDateString()}
                          </p>
                        )}
                        {reservation.estimatedDate && (
                          <p className="text-sm text-slate-600">
                            Est. Available: {new Date(reservation.estimatedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <Badge variant="secondary" className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                      <div className="flex space-x-2">
                        {reservation.status === "Available for Pickup" ? (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Check Out
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Circulation;
