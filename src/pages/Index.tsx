
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Book, Users, Calendar, Settings, Plus, BookOpen, User, Clock } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import BookCatalog from "@/components/BookCatalog";
import PatronManagement from "@/components/PatronManagement";
import Circulation from "@/components/Circulation";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

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
                  className="h-10 w-10 rounded-full filter grayscale"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Al Gazzali Library</h1>
                  <p className="text-xs text-gray-600">Management System</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
                Professional LMS
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
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              <Calendar className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center space-x-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              <BookOpen className="h-4 w-4" />
              <span>Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="patrons" className="flex items-center space-x-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              <Users className="h-4 w-4" />
              <span>Patrons</span>
            </TabsTrigger>
            <TabsTrigger value="circulation" className="flex items-center space-x-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              <Clock className="h-4 w-4" />
              <span>Circulation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <BookCatalog searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="patrons" className="space-y-6">
            <PatronManagement searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="circulation" className="space-y-6">
            <Circulation searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
