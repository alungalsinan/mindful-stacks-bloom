
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, BarChart, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ReportGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('circulation');

  const generateReport = async () => {
    setGenerating(true);
    try {
      let data;
      let filename;
      let headers;

      switch (reportType) {
        case 'circulation':
          const { data: circData } = await supabase
            .from('circulation')
            .select(`
              id,
              checkout_date,
              due_date,
              return_date,
              status,
              renewed_count,
              books(title, isbn, authors(name)),
              patrons(full_name, email, patron_id)
            `)
            .order('checkout_date', { ascending: false });

          data = circData?.map(record => ({
            'Circulation ID': record.id,
            'Book Title': record.books?.title,
            'Book ISBN': record.books?.isbn,
            'Author': record.books?.authors?.name,
            'Patron Name': record.patrons?.full_name,
            'Patron Email': record.patrons?.email,
            'Patron ID': record.patrons?.patron_id,
            'Checkout Date': new Date(record.checkout_date).toLocaleDateString(),
            'Due Date': new Date(record.due_date).toLocaleDateString(),
            'Return Date': record.return_date ? new Date(record.return_date).toLocaleDateString() : 'Not Returned',
            'Status': record.status,
            'Renewed Count': record.renewed_count || 0
          }));
          filename = 'circulation-report.csv';
          break;

        case 'overdue':
          const { data: overdueData } = await supabase
            .from('circulation')
            .select(`
              id,
              checkout_date,
              due_date,
              books(title, isbn, authors(name)),
              patrons(full_name, email, patron_id, phone)
            `)
            .eq('status', 'checked_out')
            .lt('due_date', new Date().toISOString());

          data = overdueData?.map(record => ({
            'Book Title': record.books?.title,
            'Book ISBN': record.books?.isbn,
            'Author': record.books?.authors?.name,
            'Patron Name': record.patrons?.full_name,
            'Patron Email': record.patrons?.email,
            'Patron Phone': record.patrons?.phone,
            'Checkout Date': new Date(record.checkout_date).toLocaleDateString(),
            'Due Date': new Date(record.due_date).toLocaleDateString(),
            'Days Overdue': Math.floor((Date.now() - new Date(record.due_date).getTime()) / (1000 * 60 * 60 * 24))
          }));
          filename = 'overdue-books-report.csv';
          break;

        case 'popular':
          const { data: popularData } = await supabase
            .from('circulation')
            .select('book_id, books(title, isbn, authors(name))')
            .eq('status', 'returned');

          // Count borrowings per book
          const borrowCounts = popularData?.reduce((acc: any, record) => {
            const bookId = record.book_id;
            if (!acc[bookId]) {
              acc[bookId] = {
                count: 0,
                title: record.books?.title,
                isbn: record.books?.isbn,
                author: record.books?.authors?.name
              };
            }
            acc[bookId].count++;
            return acc;
          }, {});

          data = Object.values(borrowCounts || {})
            .sort((a: any, b: any) => b.count - a.count)
            .map((book: any) => ({
              'Book Title': book.title,
              'Book ISBN': book.isbn,
              'Author': book.author,
              'Times Borrowed': book.count
            }));
          filename = 'popular-books-report.csv';
          break;

        case 'reviews':
          const { data: reviewData } = await supabase
            .from('reviews')
            .select(`
              rating,
              comment,
              created_at,
              books(title, isbn, authors(name)),
              profiles(full_name, email)
            `)
            .order('created_at', { ascending: false });

          data = reviewData?.map(review => ({
            'Book Title': review.books?.title,
            'Book ISBN': review.books?.isbn,
            'Author': review.books?.authors?.name,
            'Reviewer Name': review.profiles?.full_name,
            'Reviewer Email': review.profiles?.email,
            'Rating': review.rating,
            'Comment': review.comment || '',
            'Review Date': new Date(review.created_at).toLocaleDateString()
          }));
          filename = 'reviews-report.csv';
          break;

        default:
          throw new Error('Invalid report type');
      }

      if (!data || data.length === 0) {
        toast.error('No data available for this report');
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(data);
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const reportTypes = [
    { value: 'circulation', label: 'Circulation History', icon: BarChart },
    { value: 'overdue', label: 'Overdue Books', icon: Clock },
    { value: 'popular', label: 'Popular Books', icon: FileText },
    { value: 'reviews', label: 'Book Reviews', icon: Users }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Generate Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Report Type</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center space-x-2">
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-600">
          {reportType === 'circulation' && 'Complete history of all book borrowings and returns'}
          {reportType === 'overdue' && 'Books that are currently overdue with patron contact information'}
          {reportType === 'popular' && 'Most borrowed books ranked by popularity'}
          {reportType === 'reviews' && 'All book reviews with ratings and comments'}
        </div>

        <Button 
          onClick={generateReport}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            'Generating...'
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate CSV Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
