
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Plus, User, Clock, CheckCircle, XCircle } from "lucide-react";

interface CirculationProps {
  searchQuery: string;
  userRole: 'supervisor' | 'staff';
}

const Circulation = ({ searchQuery, userRole }: CirculationProps) => {
  const [filterStatus, setFilterStatus] = useState("all");

  const transactions = [
    {
      id: "1",
      book: "The Seven Husbands of Evelyn Hugo",
      patron: "John Smith",
      checkoutDate: "2024-06-15",
      dueDate: "2024-06-29",
      status: "checked_out",
      staff: "Library Staff"
    },
    {
      id: "2",
      book: "Where the Crawdads Sing",
      patron: "Maria Garcia",
      checkoutDate: "2024-06-10",
      returnDate: "2024-06-18",
      status: "returned",
      staff: "Library Staff"
    },
    {
      id: "3",
      book: "The Midnight Library",
      patron: "Sarah Johnson",
      checkoutDate: "2024-06-01",
      dueDate: "2024-06-15",
      status: "overdue",
      staff: "Library Staff"
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery === "" || 
      transaction.book.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.patron.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked_out": return "bg-blue-100 text-blue-800";
      case "returned": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checked_out": return BookOpen;
      case "returned": return CheckCircle;
      case "overdue": return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Circulation Management</h2>
          <p className="text-slate-600">Manage book checkouts, returns, and renewals</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
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
                  placeholder="Search by book title or patron..."
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
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const StatusIcon = getStatusIcon(transaction.status);
          return (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{transaction.book}</h3>
                      <p className="text-sm text-gray-600">Patron: {transaction.patron}</p>
                      <p className="text-xs text-gray-500">
                        Checked out: {new Date(transaction.checkoutDate).toLocaleDateString()}
                        {transaction.status !== 'returned' && (
                          <span className="ml-2">
                            Due: {new Date(transaction.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {transaction.returnDate && (
                          <span className="ml-2">
                            Returned: {new Date(transaction.returnDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                      {transaction.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {transaction.status === 'checked_out' && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Renew
                        </Button>
                        <Button variant="outline" size="sm">
                          Return
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTransactions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No transactions found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search criteria or create a new transaction.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Circulation;
