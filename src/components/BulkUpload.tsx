
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Users, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface BulkUploadProps {
  userRole: string;
}

const BulkUpload = ({ userRole }: BulkUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  if (userRole !== 'supervisor') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Only supervisors can perform bulk uploads.</p>
        </CardContent>
      </Card>
    );
  }

  const processCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        data.push(row);
      }
    }
    return data;
  };

  const processExcel = (buffer: ArrayBuffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  };

  const handleBooksUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      let data: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = processCSV(text);
      } else {
        const buffer = await file.arrayBuffer();
        data = processExcel(buffer);
      }

      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < data.length; i++) {
        const book = data[i];
        setProgress((i / data.length) * 100);

        try {
          // First, create/get author
          let authorId = null;
          if (book.author || book.Author) {
            const authorName = book.author || book.Author;
            const { data: existingAuthor } = await supabase
              .from('authors')
              .select('id')
              .eq('name', authorName)
              .single();

            if (existingAuthor) {
              authorId = existingAuthor.id;
            } else {
              const { data: newAuthor, error: authorError } = await supabase
                .from('authors')
                .insert({ name: authorName })
                .select('id')
                .single();
              
              if (authorError) throw authorError;
              authorId = newAuthor.id;
            }
          }

          // Create/get publisher
          let publisherId = null;
          if (book.publisher || book.Publisher) {
            const publisherName = book.publisher || book.Publisher;
            const { data: existingPublisher } = await supabase
              .from('publishers')
              .select('id')
              .eq('name', publisherName)
              .single();

            if (existingPublisher) {
              publisherId = existingPublisher.id;
            } else {
              const { data: newPublisher, error: publisherError } = await supabase
                .from('publishers')
                .insert({ name: publisherName })
                .select('id')
                .single();
              
              if (publisherError) throw publisherError;
              publisherId = newPublisher.id;
            }
          }

          // Create/get category
          let categoryId = null;
          if (book.category || book.Category) {
            const categoryName = book.category || book.Category;
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('name', categoryName)
              .single();

            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              const { data: newCategory, error: categoryError } = await supabase
                .from('categories')
                .insert({ name: categoryName })
                .select('id')
                .single();
              
              if (categoryError) throw categoryError;
              categoryId = newCategory.id;
            }
          }

          // Insert book
          const bookData = {
            title: book.title || book.Title,
            isbn: book.isbn || book.ISBN,
            author_id: authorId,
            publisher_id: publisherId,
            category_id: categoryId,
            publication_year: parseInt(book.publication_year || book['Publication Year']) || null,
            pages: parseInt(book.pages || book.Pages) || null,
            language: book.language || book.Language || 'English',
            description: book.description || book.Description,
            location: book.location || book.Location,
            total_copies: parseInt(book.total_copies || book['Total Copies']) || 1,
            available_copies: parseInt(book.available_copies || book['Available Copies']) || 1,
          };

          const { error: bookError } = await supabase
            .from('books')
            .insert(bookData);

          if (bookError) throw bookError;
          successCount++;
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      setResult({ success: successCount, errors });
    } catch (error: any) {
      setResult({ success: 0, errors: [error.message] });
    }

    setUploading(false);
    setProgress(100);
  };

  const handlePatronsUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      let data: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = processCSV(text);
      } else {
        const buffer = await file.arrayBuffer();
        data = processExcel(buffer);
      }

      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < data.length; i++) {
        const patron = data[i];
        setProgress((i / data.length) * 100);

        try {
          const patronData = {
            patron_id: patron.patron_id || patron['Patron ID'] || `P${Date.now()}${i}`,
            full_name: patron.full_name || patron['Full Name'],
            email: patron.email || patron.Email,
            phone: patron.phone || patron.Phone,
            address: patron.address || patron.Address,
            patron_type: patron.patron_type || patron['Patron Type'] || 'Student',
            membership_date: patron.membership_date || patron['Membership Date'] || new Date().toISOString().split('T')[0],
            expiry_date: patron.expiry_date || patron['Expiry Date'],
            status: patron.status || patron.Status || 'Active',
            max_books: parseInt(patron.max_books || patron['Max Books']) || 5,
          };

          const { error: patronError } = await supabase
            .from('patrons')
            .insert(patronData);

          if (patronError) throw patronError;
          successCount++;
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      setResult({ success: successCount, errors });
    } catch (error: any) {
      setResult({ success: 0, errors: [error.message] });
    }

    setUploading(false);
    setProgress(100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bulk Upload</h2>
        <p className="text-gray-600">Upload books and patrons in bulk using CSV or Excel files</p>
      </div>

      <Tabs defaultValue="books" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="books" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Books</span>
          </TabsTrigger>
          <TabsTrigger value="patrons" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Patrons</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Upload Books</span>
              </CardTitle>
              <CardDescription>
                Upload books using CSV or Excel format. Required columns: Title, Author, ISBN (optional), Category, Publisher, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="books-file">Select CSV or Excel file</Label>
                <Input
                  id="books-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBooksUpload(file);
                  }}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {result && (
                <Alert className={result.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                  <div className="flex items-start space-x-2">
                    {result.errors.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">
                          Successfully uploaded: {result.success} books
                        </div>
                        {result.errors.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium text-red-600">Errors:</div>
                            <ul className="mt-1 text-sm text-red-600">
                              {result.errors.slice(0, 5).map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                              {result.errors.length > 5 && (
                                <li>• ... and {result.errors.length - 5} more errors</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patrons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Upload Patrons</span>
              </CardTitle>
              <CardDescription>
                Upload patrons using CSV or Excel format. Required columns: Full Name, Email, Patron ID, Phone, Address, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patrons-file">Select CSV or Excel file</Label>
                <Input
                  id="patrons-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePatronsUpload(file);
                  }}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {result && (
                <Alert className={result.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                  <div className="flex items-start space-x-2">
                    {result.errors.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">
                          Successfully uploaded: {result.success} patrons
                        </div>
                        {result.errors.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium text-red-600">Errors:</div>
                            <ul className="mt-1 text-sm text-red-600">
                              {result.errors.slice(0, 5).map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                              {result.errors.length > 5 && (
                                <li>• ... and {result.errors.length - 5} more errors</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUpload;
