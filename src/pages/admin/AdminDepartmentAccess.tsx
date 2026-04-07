import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Building2,
  Plus,
  Trash2,
  Shield,
  Eye,
  Edit,
  CheckCircle,
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department_id: string | null;
  department_name?: string;
}

interface Department {
  dept_id: string;
  name_en: string;
  dept_code: string;
}

interface UserDepartmentAccess {
  id: number;
  user_id: number;
  department_id: string;
  access_level: 'view' | 'edit' | 'approve';
  granted_at: string;
  department_name: string;
  username: string;
}

export const AdminDepartmentAccess: React.FC = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [accessList, setAccessList] = useState<UserDepartmentAccess[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('view');

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users (managers only)
        const usersRes = await ApiService.get<{ success: boolean; data: User[] }>('/auth/users');
        if (usersRes.success) {
          setUsers(usersRes.data.filter(u => u.role === 'manager'));
        }

        // Fetch departments
        const deptRes = await ApiService.get<{ success: boolean; data: Department[] }>('/departments');
        if (deptRes.success) {
          setDepartments(deptRes.data);
        }

        // Fetch access list
        const accessRes = await ApiService.get<{ success: boolean; data: UserDepartmentAccess[] }>('/auth/department-access');
        if (accessRes.success) {
          setAccessList(accessRes.data);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const grantAccess = async () => {
    if (!selectedUser || !selectedDepartment) {
      toast({ title: 'Please select user and department', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await ApiService.post<{ success: boolean; message: string; data: { id: number } }>(
        '/auth/department-access',
        {
          user_id: parseInt(selectedUser),
          department_id: selectedDepartment,
          access_level: selectedAccessLevel,
        }
      );

      if (res.success) {
        toast({ title: 'Access granted successfully' });
        // Refresh access list
        const accessRes = await ApiService.get<{ success: boolean; data: UserDepartmentAccess[] }>('/auth/department-access');
        if (accessRes.success) {
          setAccessList(accessRes.data);
        }
        setSelectedUser('');
        setSelectedDepartment('');
      }
    } catch (err) {
      toast({ title: 'Failed to grant access', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const revokeAccess = async (id: number) => {
    try {
      const res = await ApiService.delete<{ success: boolean; message: string }>(
        `/auth/department-access/${id}`
      );

      if (res.success) {
        toast({ title: 'Access revoked successfully' });
        setAccessList(accessList.filter(a => a.id !== id));
      }
    } catch (err) {
      toast({ title: 'Failed to revoke access', variant: 'destructive' });
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'approve':
        return <Shield className="h-4 w-4" />;
      case 'edit':
        return <Edit className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'approve':
        return 'bg-purple-100 text-purple-800';
      case 'edit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Department Access Management</h1>
            <p className="text-gray-500">Assign department access to managers</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : (
          <>
            {/* Grant Access Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Grant Department Access
                </CardTitle>
                <CardDescription>
                  Assign department access to managers so they can enter KPI data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User (Manager)
                    </Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.dept_id} value={dept.dept_id}>
                            {dept.name_en} ({dept.dept_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Access Level
                    </Label>
                    <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="approve">Approve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={grantAccess} disabled={saving} className="w-full">
                      {saving ? 'Granting...' : 'Grant Access'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Access Assignments</CardTitle>
                <CardDescription>
                  {accessList.length} department access assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessList.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No Access Assigned</h3>
                    <p className="text-gray-500">Grant department access to managers above</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 border">User</th>
                          <th className="text-left p-3 border">Department</th>
                          <th className="text-left p-3 border">Access Level</th>
                          <th className="text-left p-3 border">Granted At</th>
                          <th className="p-3 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessList.map(access => (
                          <tr key={access.id} className="hover:bg-gray-50">
                            <td className="p-3 border">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{access.username}</span>
                              </div>
                            </td>
                            <td className="p-3 border">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                {access.department_name}
                              </div>
                            </td>
                            <td className="p-3 border">
                              <Badge className={getAccessLevelColor(access.access_level)}>
                                {getAccessLevelIcon(access.access_level)}
                                <span className="ml-1 capitalize">{access.access_level}</span>
                              </Badge>
                            </td>
                            <td className="p-3 border text-gray-500">
                              {new Date(access.granted_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 border text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => revokeAccess(access.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Permissions Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Role Permissions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">SuperAdmin</span>
                    </div>
                    <p className="text-sm text-gray-500">Full access to all departments and all functions</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold">Admin</span>
                    </div>
                    <p className="text-sm text-gray-500">Full access to all departments, can approve entries</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Manager</span>
                    </div>
                    <p className="text-sm text-gray-500">Access only to assigned departments, can edit entries</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold">User</span>
                    </div>
                    <p className="text-sm text-gray-500">View only access to dashboards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ShellLayout>
  );
};

export default AdminDepartmentAccess;
