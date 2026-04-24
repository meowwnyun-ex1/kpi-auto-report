import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DepartmentSelector } from '@/components/kpi/DepartmentSelector';

interface DeptYearSelectorProps {
  selectedDept: string;
  setSelectedDept: (v: string) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  selectedCategory: string;
}

export function DeptYearSelector({
  selectedDept,
  setSelectedDept,
  selectedYear,
  setSelectedYear,
  selectedCategory,
}: DeptYearSelectorProps) {
  if (!selectedCategory) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
            2
          </span>
          Select Department & Fiscal Year
        </CardTitle>
        <CardDescription>Choose department and fiscal year for action plans</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <DepartmentSelector
              value={selectedDept}
              onChange={setSelectedDept}
              label="Department"
              placeholder="Select department"
              showKpiOnly={true}
              restrictToUserDept={true}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fiscal Year
            </Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">FY2024</SelectItem>
                <SelectItem value="2025">FY2025</SelectItem>
                <SelectItem value="2026">FY2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedDept && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>FY{selectedYear}:</strong> April {selectedYear} - March{' '}
              {selectedYear + 1}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
