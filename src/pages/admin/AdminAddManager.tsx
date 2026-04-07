import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  Tag,
  Loader2,
  Check,
  X,
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

interface Manager {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string;
  department_name: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  dept_id: string;
  dept_code: string;
  name_en: string;
  name_th: string;
  division: string;
}

interface KpiCategory {
  key: string;
  name_en: string;
  name_th: string;
}

const ROLES = [
  { value: 'manager', label: 'Manager', description: 'Can edit KPI data for assigned departments' },
  { value: 'admin', label: 'Admin', description: 'Full access to all departments and users' },
  { value: 'superadmin', label: 'Super Admin', description: 'Full system access including approvals' },
];

const ACCESS_LEVELS = [
  { value: 'view', label: 'View Only', description: 'Can only view data' },
  { value: 'edit', label: 'Edit', description: 'Can edit and submit data' },
  { value: 'approve', label: 'Approve', description: 'Can approve submitted data' },
];

export default function AdminAddManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [kpiCategories, setKpiCategories] = useState<KpiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [departmentAccess, setDepartmentAccess] = useState<{ department_id: string; access_level: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (isAdmin) {
      fetchManagers();
      fetchDepartments();
      fetchKpiCategories();
    }
  }, [isAdmin]);

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/managers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setManagers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/spo-departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchKpiCategories = async () => {
    try {
      const response = await fetch('/api/admin/kpi-categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setKpiCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch KPI categories:', error);
    }
  };

  const searchEmployees = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/admin/employees/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Failed to search employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to search employees',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const openAddDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedRole('manager');
    setDepartmentAccess([{
      department_id: employee.department_id,
      access_level: 'edit',
    }]);
    setSelectedCategories([]);
    setShowAddDialog(true);
  };

  const addDepartmentAccess = () => {
    setDepartmentAccess([...departmentAccess, { department_id: '', access_level: 'edit' }]);
  };

  const removeDepartmentAccess = (index: number) => {
    setDepartmentAccess(departmentAccess.filter((_, i) => i !== index));
  };

  const updateDepartmentAccess = (index: number, field: 'department_id' | 'access_level', value: string) => {
    const updated = [...departmentAccess];
    updated[index][field] = value;
    setDepartmentAccess(updated);
  };

  const toggleCategory = (categoryKey: string) => {
    if (selectedCategories.includes(categoryKey)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryKey));
    } else {
      setSelectedCategories([...selectedCategories, categoryKey]);
    }
  };

  const saveManager = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.employee_id,
          role: selectedRole,
          department_access: departmentAccess.filter(d => d.department_id),
          kpi_categories: selectedCategories,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        setShowAddDialog(false);
        fetchManagers();
        setEmployees([]);
        setSearchQuery('');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save manager',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save manager:', error);
      toast({
        title: 'Error',
        description: 'Failed to save manager',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const removeManager = async (managerId: number, managerName: string) => {
    if (!confirm(`Remove manager role from ${managerName}?`)) return;

    try {
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Manager role removed',
        });
        fetchManagers();
      }
    } catch (error) {
      console.error('Failed to remove manager:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove manager',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-500';
      case 'admin': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isAdmin) {
    return (
      <ShellLayout variant="sidebar">
        <div className="flex items-center justify-center h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need admin privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout variant="sidebar">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Add and manage managers, assign department access and KPI categories</p>
        </div>

        {/* Search Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Employees
            </CardTitle>
            <CardDescription>
              Search by employee ID, name, or email to add as manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter employee ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchEmployees()}
                className="flex-1"
              />
              <Button onClick={searchEmployees} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            {/* Search Results */}
            {employees.length > 0 && (
              <div className="mt-4 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.employee_id}>
                        <TableCell className="font-mono">{emp.employee_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{emp.name_en}</div>
                            <div className="text-sm text-muted-foreground">{emp.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{emp.department_name}</div>
                            <div className="text-sm text-muted-foreground">{emp.department_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openAddDialog(emp)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add as Manager
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

        {/* Current Managers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Managers & Admins
            </CardTitle>
            <CardDescription>
              List of all users with manager, admin, or superadmin roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {managers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No managers found. Search and add employees above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell className="font-mono">{manager.username}</TableCell>
                      <TableCell>{manager.full_name}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(manager.role)} text-white`}>
                          {manager.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{manager.department_name || manager.department_id}</TableCell>
                      <TableCell>
                        <Badge variant={manager.is_active ? 'default' : 'secondary'}>
                          {manager.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(manager.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeManager(manager.id, manager.full_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Manager Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Manager</DialogTitle>
            <DialogDescription>
              Configure role and access for {selectedEmployee?.name_en}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Employee Info */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employee ID</Label>
                  <div className="font-mono">{selectedEmployee?.employee_id}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <div>{selectedEmployee?.name_en}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div>{selectedEmployee?.email}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <div>{selectedEmployee?.department_name}</div>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Access */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department Access
                </Label>
                <Button size="sm" variant="outline" onClick={addDepartmentAccess}>
                  Add Department
                </Button>
              </div>
              
              {departmentAccess.map((access, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={access.department_id}
                    onValueChange={(v) => updateDepartmentAccess(index, 'department_id', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.dept_id} value={dept.dept_id}>
                          {dept.name_en} ({dept.dept_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={access.access_level}
                    onValueChange={(v) => updateDepartmentAccess(index, 'access_level', v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {departmentAccess.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDepartmentAccess(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* KPI Categories */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                KPI Categories (Optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {kpiCategories.map((category) => (
                  <Badge
                    key={category.key}
                    variant={selectedCategories.includes(category.key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.key)}
                  >
                    {selectedCategories.includes(category.key) && <Check className="h-3 w-3 mr-1" />}
                    {category.name_en}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveManager} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShellLayout>
  );
}
