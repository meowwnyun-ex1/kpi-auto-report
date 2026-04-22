import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { AdminUsersList, getRoleBadge } from './components/AdminUsersList';
import { AdminUsersEditDialog } from './components/AdminUsersEditDialog';
import { storage } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Users, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SystemUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string;
  department_name: string;
  is_active: boolean;
  created_at: string;
  department_access?: { department_id: string; department_name: string; access_level: string }[];
}

interface Department {
  dept_id: string;
  dept_code: string;
  name_en: string;
  name_th: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [departmentAccess, setDepartmentAccess] = useState<
    { department_id: string; access_level: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchDepartments();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = storage.getAuthToken();
      const response = await fetch('/api/admin/managers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setSystemUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = storage.getAuthToken();
      const response = await fetch('/api/admin/spo-departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const openEditDialog = (sysUser: SystemUser) => {
    setEditingUser(sysUser);
    setSelectedRole(sysUser.role);
    setEditFullName(sysUser.full_name);
    setEditEmail(sysUser.email);
    setEditPassword('');
    setDepartmentAccess(
      sysUser.department_access?.map((a: any) => ({
        department_id: a.department_id,
        access_level: a.access_level,
      })) || [{ department_id: sysUser.department_id, access_level: 'edit' }]
    );
    setShowEditDialog(true);
  };

  const saveUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const body: any = {
        employee_id: editingUser.username,
        role: selectedRole,
        department_access: departmentAccess.filter((d) => d.department_id),
      };

      // Only include full_name if changed
      if (editFullName && editFullName !== editingUser.full_name) {
        body.full_name = editFullName;
      }

      // Only include email if changed
      if (editEmail && editEmail !== editingUser.email) {
        body.email = editEmail;
      }

      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowEditDialog(false);
        fetchUsers();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from system?`)) return;
    try {
      const response = await fetch(`/api/admin/managers/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'User removed' });
        fetchUsers();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove user', variant: 'destructive' });
    }
  };

  if (!isAdmin) {
    return (
      <ShellLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">Admin privileges required.</p>
            </CardContent>
          </Card>
        </div>
      </ShellLayout>
    );
  }

  const handleSaveUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchUsers();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    }
  };

  const handleRemoveUser = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from system?`)) return;
    try {
      const response = await fetch(`/api/admin/managers/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'User removed' });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove user', variant: 'destructive' });
    }
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title="User Management"
        icon={Users}
        iconColor="text-blue-600"
        onRefresh={fetchUsers}
        loading={loading}
        theme="blue">
        <AdminUsersList
          systemUsers={systemUsers}
          departments={departments}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          onEditUser={openEditDialog}
          onRemoveUser={handleRemoveUser}
        />

        {/* Edit User Dialog */}
        <AdminUsersEditDialog
          open={!!editingUser}
          onOpenChange={setShowEditDialog}
          editingUser={editingUser}
          departments={departments}
          isSuperAdmin={isSuperAdmin}
          onSave={handleSaveUser}
        />
      </StandardPageLayout>
    </ShellLayout>
  );
}
