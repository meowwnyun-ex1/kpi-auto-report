import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  UserPlus,
  Trash2,
  Shield,
  Users,
  Settings,
  Loader2,
  Building2,
  Edit,
  Check,
  X,
  Plus,
  ClipboardList,
  Save,
} from 'lucide-react';

interface Employee {
  employee_id: string;
  name: string;
  name_en: string;
  email: string;
  department_id: string;
  department_name: string;
  position_level_id: number;
  is_head: boolean;
}

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

interface KPITemplate {
  id?: number;
  category_id: number;
  category_name: string;
  metric_no: string;
  metric_name: string;
  unit: string;
  measurement: string;
  is_active: boolean;
}

const CATEGORIES = [
  { id: 1, name: 'Safety', key: 'safety' },
  { id: 2, name: 'Quality', key: 'quality' },
  { id: 3, name: 'Delivery', key: 'delivery' },
  { id: 4, name: 'Compliance', key: 'compliance' },
  { id: 5, name: 'HR', key: 'hr' },
  { id: 6, name: 'Attractive', key: 'attractive' },
  { id: 7, name: 'Environment', key: 'environment' },
  { id: 8, name: 'Cost', key: 'cost' },
];

const ROLES = [
  { value: 'user', label: 'User', description: 'View only' },
  { value: 'manager', label: 'Manager', description: 'Edit assigned departments' },
  { value: 'admin', label: 'Admin', description: 'Full access' },
  { value: 'superadmin', label: 'Super Admin', description: 'Full system control' },
];

const ACCESS_LEVELS = [
  { value: 'view', label: 'View', color: 'bg-gray-500' },
  { value: 'edit', label: 'Edit', color: 'bg-blue-500' },
  { value: 'approve', label: 'Approve', color: 'bg-green-500' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [kpiTemplates, setKpiTemplates] = useState<KPITemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiSaving, setKpiSaving] = useState(false);

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [departmentAccess, setDepartmentAccess] = useState<
    { department_id: string; access_level: string }[]
  >([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchDepartments();
      fetchKPITemplates();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/managers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      const response = await fetch('/api/admin/spo-departments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchKPITemplates = async () => {
    setKpiLoading(true);
    try {
      const response = await fetch('/api/admin/kpi-templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) setKpiTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to fetch KPI templates:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const searchEmployees = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/employees/search?q=${encodeURIComponent(searchQuery)}&limit=30`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();
      if (data.success) setEmployees(data.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to search employees', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const openAddDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedRole('manager');
    setDepartmentAccess([{ department_id: employee.department_id, access_level: 'edit' }]);
    setShowAddDialog(true);
  };

  const openEditDialog = (sysUser: SystemUser) => {
    setEditingUser(sysUser);
    setSelectedRole(sysUser.role);
    setDepartmentAccess(
      sysUser.department_access?.map((a) => ({
        department_id: a.department_id,
        access_level: a.access_level,
      })) || []
    );
    setShowEditDialog(true);
  };

  const addDepartmentAccess = () => {
    setDepartmentAccess([...departmentAccess, { department_id: '', access_level: 'edit' }]);
  };

  const removeDepartmentAccess = (index: number) => {
    setDepartmentAccess(departmentAccess.filter((_, i) => i !== index));
  };

  const updateDepartmentAccess = (
    index: number,
    field: 'department_id' | 'access_level',
    value: string
  ) => {
    const updated = [...departmentAccess];
    updated[index][field] = value;
    setDepartmentAccess(updated);
  };

  const saveUser = async (isEdit: boolean = false) => {
    const employeeId = isEdit ? editingUser?.username : selectedEmployee?.employee_id;
    if (!employeeId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employee_id: employeeId,
          role: selectedRole,
          department_access: departmentAccess.filter((d) => d.department_id),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowAddDialog(false);
        setShowEditDialog(false);
        fetchUsers();
        setEmployees([]);
        setSearchQuery('');
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
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-red-500',
      admin: 'bg-blue-500',
      manager: 'bg-green-500',
      user: 'bg-gray-500',
    };
    return <Badge className={`${colors[role] || 'bg-gray-500'} text-white`}>{role}</Badge>;
  };

  // KPI Template handlers
  const addKPITemplate = () => {
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    const newTemplate: KPITemplate = {
      category_id: selectedCategory,
      category_name: category?.name || '',
      metric_no: '',
      metric_name: '',
      unit: '',
      measurement: '',
      is_active: true,
    };
    setKpiTemplates([...kpiTemplates, newTemplate]);
  };

  const removeKPITemplate = (index: number) => {
    setKpiTemplates(kpiTemplates.filter((_, i) => i !== index));
  };

  const updateKPITemplate = (
    index: number,
    field: keyof KPITemplate,
    value: string | number | boolean
  ) => {
    const updated = [...kpiTemplates];
    updated[index][field] = value as never;
    setKpiTemplates(updated);
  };

  const saveKPITemplates = async () => {
    setKpiSaving(true);
    try {
      const response = await fetch('/api/admin/kpi-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ templates: kpiTemplates }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'KPI templates saved successfully' });
        fetchKPITemplates();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save KPI templates',
        variant: 'destructive',
      });
    } finally {
      setKpiSaving(false);
    }
  };

  const filteredKPITemplates = kpiTemplates.filter((t) => t.category_id === selectedCategory);

  if (!isAdmin) {
    return (
      <ShellLayout variant="sidebar">
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

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground">Manage users and system settings</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="kpi" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              KPI Items
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* Search Employees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Add User from Employee List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search by employee ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchEmployees()}
                    className="flex-1"
                  />
                  <Button onClick={searchEmployees} disabled={searching}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {employees.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="w-24">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((emp) => (
                          <TableRow key={emp.employee_id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm">{emp.employee_id}</TableCell>
                            <TableCell>
                              <div className="font-medium">{emp.name_en}</div>
                              <div className="text-xs text-muted-foreground">{emp.name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{emp.department_name}</div>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => openAddDialog(emp)}>
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Users</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : systemUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. Search and add employees above.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Username</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="w-20">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemUsers.map((u) => (
                          <TableRow key={u.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm">{u.username}</TableCell>
                            <TableCell className="font-medium">{u.full_name}</TableCell>
                            <TableCell>{getRoleBadge(u.role)}</TableCell>
                            <TableCell className="text-sm">{u.department_name || '-'}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeUser(u.id, u.full_name)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kpi" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">KPI Item Templates</CardTitle>
                  <CardDescription>Define KPI items for each category</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addKPITemplate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                  <Button size="sm" onClick={saveKPITemplates} disabled={kpiSaving}>
                    {kpiSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label>Select Category</Label>
                  <Select
                    value={selectedCategory.toString()}
                    onValueChange={(v) => setSelectedCategory(parseInt(v))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {kpiLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-24">Metric No</TableHead>
                          <TableHead>Metric Name</TableHead>
                          <TableHead className="w-20">Unit</TableHead>
                          <TableHead className="w-32">Measurement</TableHead>
                          <TableHead className="w-20">Active</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKPITemplates.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground">
                              No KPI items for this category. Click "Add Item" to create one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredKPITemplates.map((template, idx) => {
                            const globalIdx = kpiTemplates.findIndex((t) => t === template);
                            return (
                              <TableRow key={globalIdx}>
                                <TableCell>
                                  <Input
                                    value={template.metric_no}
                                    onChange={(e) =>
                                      updateKPITemplate(globalIdx, 'metric_no', e.target.value)
                                    }
                                    className="border-0 bg-transparent"
                                    placeholder="1.1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={template.metric_name}
                                    onChange={(e) =>
                                      updateKPITemplate(globalIdx, 'metric_name', e.target.value)
                                    }
                                    className="border-0 bg-transparent"
                                    placeholder="Metric name"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={template.unit}
                                    onChange={(e) =>
                                      updateKPITemplate(globalIdx, 'unit', e.target.value)
                                    }
                                    className="border-0 bg-transparent w-16"
                                    placeholder="%"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={template.measurement}
                                    onChange={(e) =>
                                      updateKPITemplate(globalIdx, 'measurement', e.target.value)
                                    }
                                    className="border-0 bg-transparent"
                                    placeholder="Monthly"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                    {template.is_active ? 'Yes' : 'No'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeKPITemplate(globalIdx)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fiscal Year</Label>
                    <Select defaultValue="2026">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select defaultValue="th">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="th">Thai</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Set role for {selectedEmployee?.name_en}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">ID:</span> {selectedEmployee?.employee_id}
                </div>
                <div>
                  <span className="text-muted-foreground">Dept:</span>{' '}
                  {selectedEmployee?.department_name}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveUser} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShellLayout>
  );
}
