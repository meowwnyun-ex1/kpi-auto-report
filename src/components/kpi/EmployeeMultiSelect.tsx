import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/loading-overlay';
import { Users, Search, X } from 'lucide-react';
import { storage } from '@/shared/utils';

interface Employee {
  employee_id: string;
  name_en: string;
  name?: string;
  department_id: string;
  department_name?: string;
  position_level_id?: number;
  is_head?: boolean;
}

interface EmployeeMultiSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  departmentId?: string;
  placeholder?: string;
  disabled?: boolean;
  maxSelected?: number;
}

export function EmployeeMultiSelect({
  selected,
  onChange,
  departmentId,
  placeholder = 'Select employees',
  disabled = false,
  maxSelected,
}: EmployeeMultiSelectProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [departmentId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const url = departmentId
        ? `/api/admin/employees/search?department_id=${departmentId}&limit=100`
        : '/api/admin/employees?limit=200';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.department_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleEmployee = (empId: string) => {
    if (disabled) return;
    if (maxSelected && selected.length >= maxSelected && !selected.includes(empId)) {
      return; // Max reached
    }

    if (selected.includes(empId)) {
      onChange(selected.filter((id) => id !== empId));
    } else {
      onChange([...selected, empId]);
    }
  };

  const removeEmployee = (empId: string) => {
    if (disabled) return;
    onChange(selected.filter((id) => id !== empId));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Get selected employee details
  const selectedEmployees = employees.filter((e) => selected.includes(e.employee_id));

  return (
    <div className="space-y-2">
      {/* Selected employees display */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-md">
          {selectedEmployees.map((emp) => (
            <Badge
              key={emp.employee_id}
              variant="secondary"
              className="flex items-center gap-1 pr-1">
              <span className="text-xs">{emp.name_en}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeEmployee(emp.employee_id)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {selectedEmployees.length > 1 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground ml-1">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 h-9 text-sm"
          disabled={disabled}
        />
      </div>

      {/* Employee list */}
      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {search ? 'No employees found' : 'No employees available'}
          </p>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = selected.includes(emp.employee_id);
            const isDisabled = disabled || (!!maxSelected && selected.length >= maxSelected && !isSelected);

            return (
              <label
                key={emp.employee_id}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50 ${
                  isSelected ? 'bg-blue-50' : ''
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => toggleEmployee(emp.employee_id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{emp.name_en}</span>
                    {emp.is_head && (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1">
                        Head
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>{emp.employee_id}</span>
                    {emp.department_name && (
                      <>
                        <span>·</span>
                        <span className="truncate">{emp.department_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{selected.length} selected</span>
          {maxSelected && <span>/{maxSelected}</span>}
        </div>
        <span>{employees.length} employees</span>
      </div>
    </div>
  );
}
