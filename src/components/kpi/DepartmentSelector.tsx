import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/loading-overlay';
import { Badge } from '@/components/ui/badge';
import { Building2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Department {
  dept_id: string;
  name_en: string;
  name_th?: string;
  kpi_code?: string;
  spo_dept_id?: string;
  company?: string;
  is_kpi_dept: boolean;
}

interface DepartmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showKpiOnly?: boolean;
  /** If true, managers can only see their own department */
  restrictToUserDept?: boolean;
}

export function DepartmentSelector({
  value,
  onChange,
  label = 'Department',
  placeholder = 'Select department',
  disabled = false,
  showKpiOnly = false,
  restrictToUserDept = true,
}: DepartmentSelectorProps) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin or superadmin - they see ALL departments
  const isAdmin = user?.role && ['admin', 'superadmin'].includes(user.role);

  // Manager can have multiple departments via department_access array
  const userDepartmentId = user?.department_id;
  const userDepartmentAccess = (user as any)?.department_access || [];

  // Combine default department with additional access for managers
  const managerDepartments =
    userDepartmentId && !userDepartmentAccess.includes(userDepartmentId)
      ? [userDepartmentId, ...userDepartmentAccess]
      : userDepartmentAccess;

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        let depts = data.data;

        // Filter to show only KPI departments if requested
        if (showKpiOnly) {
          depts = depts.filter((d: Department) => d.is_kpi_dept);
        }

        // Admin/SuperAdmin see ALL departments
        if (isAdmin) {
          setDepartments(depts);
          return;
        }

        // Manager: filter to their assigned departments (can be multiple)
        if (restrictToUserDept && managerDepartments.length > 0) {
          depts = depts.filter(
            (d: Department) =>
              managerDepartments.includes(d.dept_id) || managerDepartments.includes(d.kpi_code)
          );
        }

        setDepartments(depts);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-select user's department if only one option and not admin
  useEffect(() => {
    if (!loading && departments.length === 1 && !value && !isAdmin) {
      onChange(departments[0].dept_id);
    }
  }, [loading, departments, value, isAdmin, onChange]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // If restricted and only one department for manager, show as badge
  if (restrictToUserDept && !isAdmin && departments.length === 1) {
    const dept = departments[0];
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 text-sm py-1 px-3">
            <Building2 className="h-3 w-3 mr-1" />
            {dept.dept_id} - {dept.name_en}
          </Badge>
          <span title="Restricted to your department">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </span>
        </div>
      </div>
    );
  }

  // Manager with multiple departments - show count badge
  if (restrictToUserDept && !isAdmin && departments.length > 1) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <SelectValue placeholder={`${departments.length} departments available`} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.dept_id} value={dept.dept_id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dept.dept_id}</span>
                  <span className="text-muted-foreground">- {dept.name_en}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Group departments: KPI departments first, then others
  const kpiDepts = departments.filter((d) => d.is_kpi_dept);
  const otherDepts = departments.filter((d) => !d.is_kpi_dept);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {/* KPI Departments Group */}
          {kpiDepts.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                KPI Departments
              </div>
              {kpiDepts.map((dept) => (
                <SelectItem key={dept.dept_id} value={dept.dept_id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dept.dept_id}</span>
                    <span className="text-muted-foreground">- {dept.name_en}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Other Departments Group (only for admins) */}
          {otherDepts.length > 0 && !showKpiOnly && isAdmin && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                Other Departments
              </div>
              {otherDepts.slice(0, 20).map((dept) => (
                <SelectItem key={dept.dept_id} value={dept.dept_id}>
                  <div className="flex flex-col">
                    <span>{dept.name_en}</span>
                    <span className="text-xs text-muted-foreground">{dept.dept_id}</span>
                  </div>
                </SelectItem>
              ))}
              {otherDepts.length > 20 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  +{otherDepts.length - 20} more...
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default DepartmentSelector;
