import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { storage } from '@/shared/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TOAST_MESSAGES } from '@/shared/constants';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  UserPlus,
  Loader2,
  Check,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';

interface Associate {
  employee_id: string;
  name: string;
  name_en: string;
  email: string;
  department_id: string;
  department_name: string;
  position_level_id: number;
  is_head: boolean;
  section_name?: string;
}

interface Department {
  dept_id: string;
  name_en: string;
}

const ROLES = [
  { value: 'user', label: 'User', description: 'View only' },
  { value: 'manager', label: 'Manager', description: 'Edit assigned departments' },
  { value: 'admin', label: 'Admin', description: 'Full access' },
  { value: 'superadmin', label: 'Super Admin', description: 'Full system control' },
];

export default function AdminEmployeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Associate[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Associate | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Load all employees on mount
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchDepartments();
    }
  }, [isAdmin]);

  // Filter employees when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (e) =>
            e.employee_id.toLowerCase().includes(query) ||
            e.name_en?.toLowerCase().includes(query) ||
            e.name?.toLowerCase().includes(query) ||
            e.department_name?.toLowerCase().includes(query)
        )
      );
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, employees]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/employees', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        // Sort by associate ID
        const sortedEmployees = data.data.sort((a: Associate, b: Associate) =>
          a.employee_id.localeCompare(b.employee_id)
        );
        setEmployees(sortedEmployees);
      }
    } catch (error) {
      toast({
        title: 'Failed to Load',
        description: TOAST_MESSAGES.LOAD_FAILED,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });
      const data = await response.json();
      if (data.success) setDepartments(data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const openAddDialog = (associate: Associate) => {
    setSelectedEmployee(associate);
    // Pre-select the associate's own department
    setSelectedDepts(associate.department_id ? [associate.department_id] : []);
    setShowAddDialog(true);
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const addUser = async () => {
    if (!selectedEmployee) return;
    if (selectedDepts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one department',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.employee_id,
          role: 'manager',
          department_access: selectedDepts.map((deptId) => ({
            department_id: deptId,
            access_level: 'edit',
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Manager Added Successfully',
          description: `${selectedEmployee.name_en} has been added as a manager.`,
        });
        setShowAddDialog(false);
        setEmployees(employees.filter((e) => e.employee_id !== selectedEmployee.employee_id));
      } else {
        toast({
          title: 'Failed to Add Manager',
          description: data.message || TOAST_MESSAGES.SAVE_FAILED,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: TOAST_MESSAGES.CONNECTION_ERROR,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <ShellLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Admin privileges required.</p>
          </div>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <StandardPageLayout
        title="Add New User"
        icon={UserPlus}
        iconColor="text-emerald-600"
        onRefresh={fetchAllEmployees}
        loading={loading}
        theme="emerald">
        {loading ? (
          <TableContainer
            icon={UserPlus}
            title="Employee List"
            theme="emerald"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by associate ID, name, or department..."
            searchActions={
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Associate
              </Button>
            }
            loading
          />
        ) : filteredEmployees.length === 0 ? (
          <TableContainer
            icon={UserPlus}
            title="Employee List"
            theme="emerald"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by associate ID, name, or department..."
            searchActions={
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Associate
              </Button>
            }
            empty
            emptyTitle={searchQuery ? 'No associates found' : 'No associates loaded'}
            emptyDescription={
              searchQuery ? 'Try a different search term.' : 'No associates available.'
            }
            pagination={{
              currentPage,
              totalPages: Math.ceil(filteredEmployees.length / itemsPerPage),
              totalItems: filteredEmployees.length,
              itemsPerPage,
              onPageChange: setCurrentPage,
              onItemsPerPageChange: setItemsPerPage,
            }}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-emerald-50 to-green-100 sticky top-0 z-10">
                  <TableRow className={TABLE_STYLES.headerRow}>
                    <TableHead
                      className={`flex-shrink-0 w-12 bg-emerald-50 ${TABLE_STYLES.headerCell} pl-6`}>
                      #
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[120px] flex-shrink-0`}>
                      Associate ID
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0`}>
                      Name
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[200px] flex-shrink-0`}>
                      Email
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0`}>
                      Department
                    </TableHead>
                    <TableHead
                      className={`flex-shrink-0 w-24 bg-emerald-50 ${TABLE_STYLES.headerCell} pr-6`}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((emp, idx) => (
                    <TableRow
                      key={emp.employee_id}
                      className={`${TABLE_STYLES.dataRow} hover:bg-emerald-50/30 cursor-pointer`}
                      onClick={() => openAddDialog(emp)}>
                      <TableCell
                        className={`${TABLE_STYLES.rowNumber} bg-emerald-50/50 flex-shrink-0 w-12`}>
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm py-4 bg-white min-w-[120px] flex-shrink-0">
                        {emp.employee_id}
                      </TableCell>
                      <TableCell className="font-medium py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                        {emp.name_en}
                      </TableCell>
                      <TableCell className="text-sm py-4 bg-white min-w-[200px] flex-shrink-0">
                        {emp.email}
                      </TableCell>
                      <TableCell className="text-sm py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                        <div>{emp.department_name}</div>
                      </TableCell>
                      <TableCell
                        className={`${TABLE_STYLES.actionCell} bg-white flex-shrink-0 w-24`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddDialog(emp);
                          }}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        ) : (
          <TableContainer
            icon={UserPlus}
            title="Employee List"
            theme="emerald"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by associate ID, name, or department..."
            searchActions={
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Associate
              </Button>
            }
            pagination={{
              currentPage,
              totalPages: Math.ceil(filteredEmployees.length / itemsPerPage),
              totalItems: filteredEmployees.length,
              itemsPerPage,
              onPageChange: setCurrentPage,
              onItemsPerPageChange: setItemsPerPage,
            }}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-emerald-50 to-green-100 sticky top-0 z-10">
                  <TableRow className={TABLE_STYLES.headerRow}>
                    <TableHead
                      className={`flex-shrink-0 w-12 bg-emerald-50 ${TABLE_STYLES.headerCell} pl-6`}>
                      #
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[120px] flex-shrink-0`}>
                      Associate ID
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0`}>
                      Name
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[200px] flex-shrink-0`}>
                      Email
                    </TableHead>
                    <TableHead
                      className={`bg-emerald-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0`}>
                      Department
                    </TableHead>
                    <TableHead
                      className={`flex-shrink-0 w-24 bg-emerald-50 ${TABLE_STYLES.headerCell} pr-6`}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((emp, idx) => (
                    <TableRow
                      key={emp.employee_id}
                      className={`${TABLE_STYLES.dataRow} hover:bg-emerald-50/30 cursor-pointer`}
                      onClick={() => openAddDialog(emp)}>
                      <TableCell
                        className={`${TABLE_STYLES.rowNumber} bg-emerald-50/50 flex-shrink-0 w-12`}>
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm py-4 bg-white min-w-[120px] flex-shrink-0">
                        {emp.employee_id}
                      </TableCell>
                      <TableCell className="font-medium py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                        {emp.name_en}
                      </TableCell>
                      <TableCell className="text-sm py-4 bg-white min-w-[200px] flex-shrink-0">
                        {emp.email}
                      </TableCell>
                      <TableCell className="text-sm py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                        <div>{emp.department_name}</div>
                      </TableCell>
                      <TableCell
                        className={`${TABLE_STYLES.actionCell} bg-white flex-shrink-0 w-24`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddDialog(emp);
                          }}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableContainer>
        )}

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add as Manager
              </DialogTitle>
              <DialogDescription>
                Select departments for <strong>{selectedEmployee?.name_en}</strong> to manage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{' '}
                    {selectedEmployee?.employee_id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Dept:</span>{' '}
                    {selectedEmployee?.department_name}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Departments to Manage
                </Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {departments.map((dept) => (
                    <div
                      key={dept.dept_id}
                      className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 ${
                        selectedDepts.includes(dept.dept_id) ? 'bg-emerald-50' : ''
                      }`}
                      onClick={() => toggleDepartment(dept.dept_id)}>
                      <div
                        className={`w-5 h-5 border rounded flex items-center justify-center ${
                          selectedDepts.includes(dept.dept_id)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300'
                        }`}>
                        {selectedDepts.includes(dept.dept_id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm">{dept.name_en}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedDepts.length} department(s)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addUser} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add as Manager
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </StandardPageLayout>
    </ShellLayout>
  );
}
