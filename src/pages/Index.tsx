
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Book className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">LibraryOS</h1>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Next-Gen LMS
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search books, patrons, or transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button variant="outline" size="sm">
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
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="patrons" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Patrons</span>
            </TabsTrigger>
            <TabsTrigger value="circulation" className="flex items-center space-x-2">
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
