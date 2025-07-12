import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Edit, Trash2, RefreshCw, Users, Book, Calendar, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
  password?: string;
}

interface StudentDetails {
  student: Student & { password: string };
  circulation: any[];
  stats: any[];
}

const SupervisorStudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editData, setEditData] = useState({ username: '', fullName: '', password: '' });
  const [resetPassword, setResetPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const { data, error } = await supabase.functions.invoke('supervisor-manage-students', {
        body: { action: 'getAllStudents' },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      setStudents(data.students || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const { data, error } = await supabase.functions.invoke('supervisor-manage-students', {
        body: { action: 'getStudentDetails', studentId },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      setSelectedStudent(data);
      setEditData({
        username: data.student.username,
        fullName: data.student.full_name,
        password: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async () => {
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem('auth_token');
      const { data, error } = await supabase.functions.invoke('supervisor-manage-students', {
        body: {
          action: 'updateStudent',
          studentId: selectedStudent.student.id,
          data: editData
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Student updated successfully"
      });
      
      loadStudents();
      loadStudentDetails(selectedStudent.student.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent || !resetPassword) return;

    try {
      const token = localStorage.getItem('auth_token');
      const { error } = await supabase.functions.invoke('supervisor-manage-students', {
        body: {
          action: 'resetPassword',
          studentId: selectedStudent.student.id,
          data: { newPassword: resetPassword }
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Password reset successfully"
      });
      
      setResetPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const { error } = await supabase.functions.invoke('supervisor-manage-students', {
        body: { action: 'deleteStudent', studentId },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Student deleted successfully"
      });
      
      loadStudents();
      setSelectedStudent(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600">Manage all student accounts and activities</p>
        </div>
        <Button onClick={loadStudents} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Students ({students.length})
            </CardTitle>
            <CardDescription>
              Click on a student to view details and manage their account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudent?.student.id === student.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadStudentDetails(student.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-gray-500">@{student.username}</p>
                    </div>
                    <Badge variant="secondary">Student</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Student Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={editData.username}
                          onChange={(e) => setEditData({...editData, username: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editData.fullName}
                          onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password">New Password (leave empty to keep current)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={editData.password}
                        onChange={(e) => setEditData({...editData, password: e.target.value})}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={updateStudent} className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Student
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteStudent(selectedStudent.student.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label>Current Password Hash</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={selectedStudent.student.password || ''}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="resetPassword">Quick Password Reset</Label>
                      <div className="flex gap-2">
                        <Input
                          id="resetPassword"
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <Button onClick={handleResetPassword} disabled={!resetPassword}>
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Book className="h-4 w-4 mr-2" />
                    Borrowing History
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedStudent.circulation?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{item.books?.title}</p>
                        <p className="text-sm text-gray-600">
                          Author: {item.books?.authors?.name}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Status: {item.status}</span>
                          <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Reading Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudent.stats?.map((stat: any) => (
                      <div key={`${stat.year}-${stat.month}`} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{stat.month}/{stat.year}</p>
                        <p className="text-sm">Borrowed: {stat.books_borrowed || 0}</p>
                        <p className="text-sm">Returned: {stat.books_returned || 0}</p>
                        <p className="text-sm">Pages: {stat.total_pages_read || 0}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a student to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorStudentManagement;