import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, Search, Plus, Edit, BookOpen } from "lucide-react";

interface BookCatalogProps {
  searchQuery: string;
  userRole: 'supervisor' | 'staff' | 'student';
}

const BookCatalog = ({ searchQuery, userRole }: BookCatalogProps) => {
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const books = [
    {
      id: "1",
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      isbn: "978-1501161933",
      genre: "Fiction",
      status: "Available",
      copies: 3,
      available: 1,
      publishYear: 2017,
      location: "A-F-001"
    },
    {
      id: "2",
      title: "Where the Crawdads Sing",
      author: "Delia Owens",
      isbn: "978-0735219090",
      genre: "Fiction",
      status: "Checked Out",
      copies: 4,
      available: 0,
      publishYear: 2018,
      location: "A-F-002"
    },
    {
      id: "3",
      title: "Educated",
      author: "Tara Westover",
      isbn: "978-0399590504",
      genre: "Biography",
      status: "Available",
      copies: 2,
      available: 2,
      publishYear: 2018,
      location: "B-B-001"
    },
    {
      id: "4",
      title: "The Midnight Library",
      author: "Matt Haig",
      isbn: "978-0525559474",
      genre: "Fiction",
      status: "Reserved",
      copies: 3,
      available: 1,
      publishYear: 2020,
      location: "A-F-003"
    },
    {
      id: "5",
      title: "Atomic Habits",
      author: "James Clear",
      isbn: "978-0735211292",
      genre: "Self-Help",
      status: "Available",
      copies: 5,
      available: 3,
      publishYear: 2018,
      location: "C-S-001"
    },
    {
      id: "6",
      title: "The Silent Patient",
      author: "Alex Michaelides",
      isbn: "978-1250301697",
      genre: "Thriller",
      status: "Available",
      copies: 2,
      available: 1,
      publishYear: 2019,
      location: "A-T-001"
    }
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = searchQuery === "" || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);
    
    const matchesGenre = filterGenre === "all" || book.genre === filterGenre;
    const matchesStatus = filterStatus === "all" || book.status === filterStatus;
    
    return matchesSearch && matchesGenre && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800";
      case "Checked Out": return "bg-red-100 text-red-800";
      case "Reserved": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Book Catalog</h2>
          <p className="text-slate-600">Manage your library's collection</p>
        </div>
        {(userRole === 'staff' || userRole === 'supervisor') && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        )}
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
                  placeholder="Search by title, author, or ISBN..."
                  className="pl-10"
                  defaultValue={searchQuery}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Genre</label>
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="Fiction">Fiction</SelectItem>
                  <SelectItem value="Biography">Biography</SelectItem>
                  <SelectItem value="Self-Help">Self-Help</SelectItem>
                  <SelectItem value="Thriller">Thriller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-slate-600">
          Showing {filteredBooks.length} of {books.length} books
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Sort by:</span>
          <Select defaultValue="title">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 mb-1">{book.title}</CardTitle>
                  <CardDescription className="text-slate-600">by {book.author}</CardDescription>
                </div>
                <Badge variant="secondary" className={getStatusColor(book.status)}>
                  {book.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">ISBN:</span>
                  <p className="font-mono text-xs">{book.isbn}</p>
                </div>
                <div>
                  <span className="text-slate-500">Genre:</span>
                  <p>{book.genre}</p>
                </div>
                <div>
                  <span className="text-slate-500">Published:</span>
                  <p>{book.publishYear}</p>
                </div>
                <div>
                  <span className="text-slate-500">Location:</span>
                  <p className="font-mono text-xs">{book.location}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm">
                  <span className="text-slate-500">Available: </span>
                  <span className="font-semibold text-slate-900">
                    {book.available}/{book.copies}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No books found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search criteria or add a new book to the catalog.
            </p>
            {(userRole === 'staff' || userRole === 'supervisor') && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookCatalog;
