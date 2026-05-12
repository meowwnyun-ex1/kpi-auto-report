import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit, Plus, Shield, Users, Building2, Settings } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';

interface DepartmentApprover {
  id: number;
  department_id: number;
  department_name: string;
  hos_approvers: number[];
  hod_approvers: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

export default function ApprovalRoutesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<DepartmentApprover[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DepartmentApprover | null>(null);
  const [formData, setFormData] = useState({
    department_id: 0,
    department_name: '',
    hos_approvers: [] as number[],
    hod_approvers: [] as number[],
  });

  // Role-based access control - only admin and superadmin can access
  const canAccess = user?.role === 'admin' || user?.role === 'superadmin';

  if (!canAccess) {
    return (
      <ShellLayout variant="admin">
        <StandardPageLayout
          title="Approval Route Management"
          icon={Settings}>
          <div className="flex flex-col items-center justify-center h-64">
            <Shield className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don't have permission to access this page.</p>
          </div>
        </StandardPageLayout>
      </ShellLayout>
    );
  }

  useEffect(() => {
    fetchRoutes();
    fetchUsers();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/approval/routes', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRoutes(
          data.map((r: any) => ({
            ...r,
            hos_approvers: r.hos_approvers ? JSON.parse(r.hos_approvers) : [],
            hod_approvers: r.hod_approvers ? JSON.parse(r.hod_approvers) : [],
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/approval/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Approval route saved successfully',
        });
        setDialogOpen(false);
        fetchRoutes();
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save approval route',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error saving approval route',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (departmentId: number) => {
    if (!confirm('Are you sure you want to deactivate this approval route?')) return;

    try {
      const response = await fetch(`/api/approval/routes/${departmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Approval route deactivated',
        });
        fetchRoutes();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to deactivate approval route',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error deactivating approval route',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (route: DepartmentApprover) => {
    setEditingRoute(route);
    setFormData({
      department_id: route.department_id,
      department_name: route.department_name,
      hos_approvers: route.hos_approvers,
      hod_approvers: route.hod_approvers,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      department_id: 0,
      department_name: '',
      hos_approvers: [],
      hod_approvers: [],
    });
  };

  const toggleApprover = (userId: number, type: 'hos' | 'hod') => {
    const current = type === 'hos' ? formData.hos_approvers : formData.hod_approvers;
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];

    if (type === 'hos') {
      setFormData({ ...formData, hos_approvers: updated });
    } else {
      setFormData({ ...formData, hod_approvers: updated });
    }
  };

  const getUserById = (userId: number) => users.find((u) => u.id === userId);

  if (loading) {
    return (
      <ShellLayout variant="admin">
        <StandardPageLayout
          title="Approval Route Management"
          icon={Settings}>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </StandardPageLayout>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout variant="admin">
      <StandardPageLayout
        title="Approval Route Management"
        icon={Settings}
        description="Configure HoS and HoD approvers for each department"
        actions={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Approval Route
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRoute ? 'Edit Approval Route' : 'Add Approval Route'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Department Name</Label>
                  <Input
                    value={formData.department_name}
                    onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                    placeholder="Enter department name"
                  />
                </div>
                <div>
                  <Label>Department ID</Label>
                  <Input
                    type="number"
                    value={formData.department_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Enter department ID"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Head of Section (HoS) Approvers
                  </Label>
                  <div className="mt-2 border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.hos_approvers.includes(user.id)}
                          onChange={() => toggleApprover(user.id, 'hos')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{user.full_name || user.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Head of Department (HoD) Approvers
                  </Label>
                  <div className="mt-2 border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.hod_approvers.includes(user.id)}
                          onChange={() => toggleApprover(user.id, 'hod')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{user.full_name || user.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department Approval Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>HoS Approvers</TableHead>
                  <TableHead>HoD Approvers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No approval routes configured yet
                    </TableCell>
                  </TableRow>
                ) : (
                  routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.department_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {route.hos_approvers.length === 0 ? (
                            <span className="text-gray-400 text-sm">None</span>
                          ) : (
                            route.hos_approvers.map((userId) => {
                              const user = getUserById(userId);
                              return user ? (
                                <Badge key={userId} variant="secondary" className="text-xs">
                                  {user.full_name || user.username}
                                </Badge>
                              ) : null;
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {route.hod_approvers.length === 0 ? (
                            <span className="text-gray-400 text-sm">None</span>
                          ) : (
                            route.hod_approvers.map((userId) => {
                              const user = getUserById(userId);
                              return user ? (
                                <Badge key={userId} variant="secondary" className="text-xs">
                                  {user.full_name || user.username}
                                </Badge>
                              ) : null;
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={route.is_active ? 'default' : 'secondary'}>
                          {route.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(route.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(route)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(route.department_id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </StandardPageLayout>
    </ShellLayout>
  );
}
