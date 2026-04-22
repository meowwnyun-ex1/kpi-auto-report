import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users2, Check } from 'lucide-react';

interface Department {
  dept_id: string;
  name_en: string;
  name_th?: string;
  company?: string;
}

interface DepartmentMultiSelectProps {
  departments: Department[];
  selected: string[];
  onChange: (selected: string[]) => void;
  mainDepartment?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DepartmentMultiSelect({
  departments,
  selected,
  onChange,
  mainDepartment,
  placeholder = 'Select related departments',
  disabled = false,
}: DepartmentMultiSelectProps) {
  const isAllSelected = selected.includes('ALL');

  const toggleDepartment = (deptId: string) => {
    if (disabled) return;

    // If ALL is currently selected, clear it first
    if (isAllSelected) {
      onChange([deptId]);
      return;
    }

    if (selected.includes(deptId)) {
      onChange(selected.filter((id) => id !== deptId));
    } else {
      onChange([...selected, deptId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(['ALL']);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Get display text for trigger
  const getDisplayText = () => {
    if (isAllSelected) return 'All';
    if (selected.length === 0) return placeholder;
    if (selected.length <= 3) {
      return selected.join(', ');
    }
    return `${selected.length} departments`;
  };

  return (
    <div className="space-y-2">
      <Select value={isAllSelected ? 'ALL' : selected.length > 0 ? 'CUSTOM' : 'NONE'} onValueChange={(v) => {
        if (v === 'ALL') selectAll();
        else if (v === 'NONE') clearAll();
      }}>
        <SelectTrigger className="h-9 bg-white" disabled={disabled}>
          <SelectValue placeholder={placeholder}>
            <div className="flex items-center gap-2">
              {isAllSelected ? (
                <Badge className="bg-blue-100 text-blue-700">All</Badge>
              ) : selected.length > 0 ? (
                <>
                  <span className="truncate">{getDisplayText()}</span>
                  <Badge variant="secondary" className="ml-auto">{selected.length}</Badge>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* All Option */}
          <SelectItem value="ALL">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">All</Badge>
              <span className="text-muted-foreground text-xs">All departments</span>
            </div>
          </SelectItem>
          
          {/* Divider */}
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
            Or select specific departments:
          </div>
          
          {/* None/Clear Option */}
          <SelectItem value="NONE">
            <span className="text-muted-foreground">None (clear selection)</span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Department checkboxes - disabled when ALL is selected */}
      {isAllSelected && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">All Departments Selected</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All departments will have access to this item
          </p>
        </div>
      )}

      {/* Individual department list - only show when not ALL */}
      {!isAllSelected && (
        <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
          {departments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No departments available</p>
          ) : (
            departments.map((dept) => {
              const isMain = dept.dept_id === mainDepartment;
              const isSelected = selected.includes(dept.dept_id);

              return (
                <label
                  key={dept.dept_id}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50 ${
                    isMain ? 'bg-green-50' : isSelected ? 'bg-blue-50' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Checkbox
                    checked={isMain || isSelected}
                    disabled={disabled || isMain}
                    onCheckedChange={() => toggleDepartment(dept.dept_id)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">{dept.name_en}</span>
                      <Badge variant="outline" className="text-[10px] px-1">
                        {dept.dept_id}
                      </Badge>
                      {isMain && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1">
                          Main
                        </Badge>
                      )}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      )}

      {/* Selected count */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users2 className="h-3 w-3" />
        <span>
          {isAllSelected
            ? 'All departments selected'
            : `${selected.length + (mainDepartment ? 1 : 0)} departments selected${mainDepartment ? ' (including Main)' : ''}`}
        </span>
      </div>
    </div>
  );
}
