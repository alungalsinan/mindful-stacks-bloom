
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus, Edit, User, BookOpen } from "lucide-react";

interface PatronManagementProps {
  searchQuery: string;
}

const PatronManagement = ({ searchQuery }: PatronManagementProps) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const patrons = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      type: "Adult",
      status: "Active",
      memberSince: "2022-01-15",
      booksCheckedOut: 3,
      finesOwed: 0,
      totalCheckouts: 45
    },
    {
      id: "2",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "(555) 234-5678",
      type: "Adult",
      status: "Active",
      memberSince: "2023-03-22",
      booksCheckedOut: 1,
      finesOwed: 5.50,
      totalCheckouts: 12
    },
    {
      id: "3",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "(555) 345-6789",
      type: "Student",
      status: "Active",
      memberSince: "2021-09-01",
      booksCheckedOut: 5,
      finesOwed: 0,
      totalCheckouts: 89
    },
    {
      id: "4",
      name: "Michael Brown",
      email: "michael.brown@email.com",
      phone: "(555) 456-7890",
      type: "Senior",
      status: "Suspended",
      memberSince: "2020-05-10",
      booksCheckedOut: 0,
      finesOwed: 25.00,
      totalCheckouts: 156
    },
    {
      id: "5",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      phone: "(555) 567-8901",
      type: "Child",
      status: "Active",
      memberSince: "2023-08-15",
      booksCheckedOut: 2,
      finesOwed: 0,
      totalCheckouts: 8
    },
    {
      id: "6",
      name: "Robert Wilson",
      email: "robert.wilson@email.com",
      phone: "(555) 678-9012",
      type: "Faculty",
      status: "Active",
      memberSince: "2019-02-28",
      booksCheckedOut: 7,
      finesOwed: 0,
      totalCheckouts: 234
    }
  ];

  const filteredPatrons = patrons.filter(patron => {
    const matchesSearch = searchQuery === "" || 
      patron.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patron.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patron.phone.includes(searchQuery);
    
    const matchesStatus = filterStatus === "all" || patron.status === filterStatus;
    const matchesType = filterType === "all" || patron.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Suspended": return "bg-red-100 text-red-800";
      case "Expired": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Adult": return "bg-blue-100 text-blue-800";
      case "Student": return "bg-purple-100 text-purple-800";
      case "Child": return "bg-pink-100 text-pink-800";
      case "Senior": return "bg-orange-100 text-orange-800";
      case "Faculty": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patron Management</h2>
          <p className="text-slate-600">Manage library members and their accounts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Register New Patron
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
                  placeholder="Search by name, email, or phone..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Patron Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Adult">Adult</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-slate-600">
          Showing {filteredPatrons.length} of {patrons.length} patrons
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Sort by:</span>
          <Select defaultValue="name">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="memberSince">Member Since</SelectItem>
              <SelectItem value="checkouts">Checkouts</SelectItem>
              <SelectItem value="fines">Fines</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Patrons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPatrons.map((patron) => (
          <Card key={patron.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{patron.name}</CardTitle>
                    <CardDescription>{patron.email}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant="secondary" className={getStatusColor(patron.status)}>
                    {patron.status}
                  </Badge>
                  <Badge variant="outline" className={getTypeColor(patron.type)}>
                    {patron.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p>{patron.phone}</p>
                </div>
                <div>
                  <span className="text-slate-500">Member Since:</span>
                  <p>{new Date(patron.memberSince).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Books Out:</span>
                  <p className="font-semibold">{patron.booksCheckedOut}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Checkouts:</span>
                  <p>{patron.totalCheckouts}</p>
                </div>
              </div>
              
              {patron.finesOwed > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-800 font-medium">Outstanding Fines</span>
                    <span className="text-lg font-bold text-red-600">${patron.finesOwed.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t">
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-1" />
                  View History
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatrons.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No patrons found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search criteria or register a new patron.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Register New Patron
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatronManagement;
