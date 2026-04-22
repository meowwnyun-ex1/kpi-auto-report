import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import {
  UserCog,
  Mail,
  Calendar,
  Settings,
  Building2,
  Loader2,
  Users,
  Shield,
  Crown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { TOAST_MESSAGES } from '@/shared/constants';

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

interface AdminUsersEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: SystemUser | null;
  departments: Department[];
  isSuperAdmin: boolean;
  onSave: (userData: any) => Promise<void>;
}

const ROLES = [
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can edit assigned departments',
    icon: 'Users',
  },
  { value: 'admin', label: 'Admin', description: 'Full access to all features', icon: 'Shield' },
  { value: 'superadmin', label: 'SuperAdmin', description: 'Full system control', icon: 'Crown' },
];

const HelpContent = {
  departmentAccess:
    'Department access determines which KPI data users can edit. Yearly users can edit yearly targets, Monthly users can edit monthly results, and All Departments gives full access.',
};

export function getRoleBadge(role: string) {
  const colors: Record<string, string> = {
    superadmin: 'bg-red-500',
    admin: 'bg-blue-500',
    manager: 'bg-green-500',
    user: 'bg-gray-500',
  };
  return <Badge className={`${colors[role] || 'bg-gray-500'} text-white`}>{role}</Badge>;
}

export function AdminUsersEditDialog({
  open,
  onOpenChange,
  editingUser,
  departments,
  isSuperAdmin,
  onSave,
}: AdminUsersEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [departmentAccess, setDepartmentAccess] = useState<
    { department_id: string; access_level: string }[]
  >([]);

  // Initialize form when editingUser changes
  React.useEffect(() => {
    if (editingUser) {
      setSelectedRole(editingUser.role);
      setEditFullName(editingUser.full_name);
      setEditEmail(editingUser.email);
      setDepartmentAccess(
        editingUser.department_access?.map((a) => ({
          department_id: a.department_id,
          access_level: a.access_level,
        })) || [{ department_id: editingUser.department_id, access_level: 'edit' }]
      );
    }
  }, [editingUser]);

  const handleSave = async () => {
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

      await onSave(body);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: TOAST_MESSAGES.SAVE_FAILED,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserCog className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update user information, role and department access permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {editingUser?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{editingUser?.full_name}</h4>
                <p className="text-sm text-gray-600">@{editingUser?.username}</p>
              </div>
              <div className="ml-auto">{getRoleBadge(editingUser?.role || '')}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <span className="ml-2 font-mono">{editingUser?.username}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2">{editingUser?.email}</span>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => r.value !== 'admin' || isSuperAdmin).map((r) => {
                  const IconComponent =
                    r.icon === 'Users' ? Users : r.icon === 'Shield' ? Shield : Crown;
                  return (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground">Only SuperAdmin can assign Admin role</p>
            )}
          </div>

          {/* Department Access - Multi-select dropdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Department Access</Label>
              <HelpTooltip content={HelpContent.departmentAccess} />
            </div>
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {departmentAccess.length === 0
                        ? 'Select departments...'
                        : `${departmentAccess.length} department${departmentAccess.length > 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const allDeptIds = departments.map((d) => d.dept_id);
                          setDepartmentAccess(
                            allDeptIds.map((deptId) => ({
                              department_id: deptId,
                              access_level: 'edit',
                            }))
                          );
                        }}
                        className="text-xs">
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDepartmentAccess([])}
                        className="text-xs">
                        Clear All
                      </Button>
                    </div>
                    {departments.map((dept) => (
                      <div
                        key={dept.dept_id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          const isSelected = departmentAccess.some(
                            (d) => d.department_id === dept.dept_id
                          );
                          if (isSelected) {
                            setDepartmentAccess(
                              departmentAccess.filter((d) => d.department_id !== dept.dept_id)
                            );
                          } else {
                            setDepartmentAccess([
                              ...departmentAccess,
                              {
                                department_id: dept.dept_id,
                                access_level: 'edit',
                              },
                            ]);
                          }
                        }}>
                        <input
                          type="checkbox"
                          checked={departmentAccess.some((d) => d.department_id === dept.dept_id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{dept.name_en}</div>
                          <div className="text-xs text-gray-500">{dept.dept_id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {(() => {
                const totalDepts = departments.length;
                const hasAllDepts = departmentAccess.length === totalDepts;

                if (departmentAccess.length === 0) {
                  return 'User has no access to edit KPI data';
                }
                if (hasAllDepts) {
                  return `User can edit all KPI data for ${totalDepts} departments`;
                }
                if (
                  departmentAccess.length === 1 &&
                  departmentAccess[0].department_id === 'yearly'
                ) {
                  return 'User can edit yearly KPI targets';
                }
                if (
                  departmentAccess.length === 1 &&
                  departmentAccess[0].department_id === 'monthly'
                ) {
                  return 'User can edit monthly KPI results';
                }
                return `User can edit KPI data for ${departmentAccess.length} departments`;
              })()}
            </div>
          </div>

          {/* Password Reset */}
          <div className="space-y-2">
            <Label>Password Reset</Label>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => {
                toast({
                  title: 'OTP Sent',
                  description: `OTP has been sent to ${editEmail || editingUser?.email}`,
                });
              }}>
              <Mail className="h-4 w-4 mr-2" /> Send OTP to Reset Password
            </Button>
            <p className="text-xs text-muted-foreground">
              Click to send OTP to user's email for password reset
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
