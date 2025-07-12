
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Book, Users, Calendar, Settings, Plus, BookOpen, User, Clock, LogOut, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import Dashboard from "@/components/Dashboard";
import BookCatalog from "@/components/BookCatalog";
import PatronManagement from "@/components/PatronManagement";
import Circulation from "@/components/Circulation";
import BulkUpload from "@/components/BulkUpload";
import MyBorrowings from "@/components/MyBorrowings";
import StudentCirculationAnalysis from "@/components/StudentCirculationAnalysis";
import SupervisorStudentManagement from "@/components/SupervisorStudentManagement";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, loading, signOut } = useCustomAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Role-based tab visibility
  const getVisibleTabs = () => {
    const baseTabs = [
      { id: "dashboard", label: "Dashboard", icon: Calendar, visible: true },
      { id: "catalog", label: "Catalog", icon: BookOpen, visible: true },
    ];

    // Student-specific tabs
    if (user.role === 'student') {
      baseTabs.push(
        { id: "borrowings", label: "My Borrowings", icon: Book, visible: true },
        { id: "analysis", label: "Reading Analytics", icon: Calendar, visible: true }
      );
    }

    if (user.role === 'staff' || user.role === 'supervisor') {
      baseTabs.push(
        { id: "patrons", label: "Patrons", icon: Users, visible: true },
        { id: "circulation", label: "Circulation", icon: Clock, visible: true }
      );
    }

    if (user.role === 'supervisor') {
      baseTabs.push(
        { id: "upload", label: "Bulk Upload", icon: Upload, visible: true },
        { id: "students", label: "Manage Students", icon: Users, visible: true }
      );
    }

    return baseTabs.filter(tab => tab.visible);
  };

  const visibleTabs = getVisibleTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/5394ebf3-bef6-4636-87da-89934cc50142.png" 
                  alt="Al Gazzali Library" 
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Al Gazzali Library</h1>
                  <p className="text-xs text-gray-600">Management System</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search books, patrons, or transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 border-gray-300 focus:border-gray-500"
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user.fullName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${visibleTabs.length} bg-white p-1 rounded-lg shadow-sm border border-gray-200`}>
            {visibleTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="flex items-center space-x-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard searchQuery={searchQuery} userRole={user.role} />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <BookCatalog searchQuery={searchQuery} userRole={user.role} />
          </TabsContent>

          {(user.role === 'staff' || user.role === 'supervisor') && (
            <>
              <TabsContent value="patrons" className="space-y-6">
                <PatronManagement searchQuery={searchQuery} userRole={user.role} />
              </TabsContent>

              <TabsContent value="circulation" className="space-y-6">
                <Circulation searchQuery={searchQuery} userRole={user.role} />
              </TabsContent>
            </>
          )}

          {user.role === 'student' && (
            <>
              <TabsContent value="borrowings" className="space-y-6">
                <MyBorrowings />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <StudentCirculationAnalysis />
              </TabsContent>
            </>
          )}

          {user.role === 'supervisor' && (
            <>
              <TabsContent value="upload" className="space-y-6">
                <BulkUpload userRole={user.role} />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <SupervisorStudentManagement />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
