
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, User, BookOpen, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TopReader {
  user_id: string;
  full_name: string;
  email: string;
  books_borrowed: number;
  books_returned: number;
  total_pages_read: number;
}

const TopReaders = () => {
  const [topReaders, setTopReaders] = useState<TopReader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTopReaders();
  }, [selectedMonth, selectedYear]);

  const fetchTopReaders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_top_readers', {
        p_month: selectedMonth,
        p_year: selectedYear,
        p_limit: 10
      });

      if (error) throw error;
      setTopReaders(data || []);
    } catch (error) {
      console.error('Error fetching top readers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <User className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge className="bg-yellow-500">1st Place</Badge>;
      case 1:
        return <Badge className="bg-gray-400">2nd Place</Badge>;
      case 2:
        return <Badge className="bg-amber-600">3rd Place</Badge>;
      default:
        return <Badge variant="outline">#{index + 1}</Badge>;
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Top Readers</h2>
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p>Loading top readers...</p>
          </CardContent>
        </Card>
      ) : topReaders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No reading data for this period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {topReaders.map((reader, index) => (
            <Card key={reader.user_id} className={index < 3 ? "border-2 border-yellow-200" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getRankIcon(index)}
                    <div>
                      <h3 className="text-lg font-semibold">{reader.full_name}</h3>
                      <p className="text-sm text-gray-600">{reader.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span>Books</span>
                      </div>
                      <p className="font-semibold">{reader.books_borrowed}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Pages</span>
                      </div>
                      <p className="font-semibold">{reader.total_pages_read.toLocaleString()}</p>
                    </div>
                    
                    {getRankBadge(index)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopReaders;
