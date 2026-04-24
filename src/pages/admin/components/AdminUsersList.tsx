import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Mail, Building2, Users } from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';

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

interface AdminUsersListProps {
  systemUsers: SystemUser[];
  departments: Department[];
  loading: boolean;
  isSuperAdmin: boolean;
  onEditUser: (user: SystemUser) => void;
  onRemoveUser: (userId: number, userName: string) => void;
}

export function getRoleBadge(role: string) {
  const colors: Record<string, string> = {
    superadmin: 'bg-red-100 text-red-800',
    admin: 'bg-blue-100 text-blue-800',
    manager: 'bg-green-100 text-green-800',
    user: 'bg-gray-100 text-gray-800',
  };
  return <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
}

export function AdminUsersList({
  systemUsers,
  departments,
  loading,
  isSuperAdmin,
  onEditUser,
  onRemoveUser,
}: AdminUsersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return systemUsers;
    }
    const query = searchQuery.toLowerCase();
    return systemUsers.filter(
      (user) =>
        user.full_name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.department_name?.toLowerCase().includes(query)
    );
  }, [systemUsers, searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <TableContainer icon={Users} title="User Management" theme="blue" loading />;
  }

  if (systemUsers.length === 0) {
    return (
      <TableContainer
        icon={Users}
        title="User Management"
        theme="blue"
        empty
        emptyTitle="No users found"
        emptyDescription="Use Employee Search to add new users to the system."
      />
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <TableContainer
        icon={Users}
        title="User Management"
        theme="blue"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, username, email, role, or department..."
        empty
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search terms."
      />
    );
  }

  return (
    <TableContainer
      icon={Users}
      title="User Management"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by name, username, email, role, or department..."
      theme="blue"
      totalCount={filteredUsers.length}
      countUnit="user"
      pagination={{
        currentPage,
        totalPages: Math.ceil(filteredUsers.length / itemsPerPage),
        totalItems: filteredUsers.length,
        itemsPerPage,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: setItemsPerPage,
      }}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead
                className={`flex-shrink-0 w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pl-6`}>
                #
              </TableHead>
              <TableHead
                className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[150px] flex-shrink-0`}>
                Name
              </TableHead>
              <TableHead
                className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[120px] flex-shrink-0`}>
                Username
              </TableHead>
              <TableHead
                className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[200px] flex-shrink-0`}>
                Email
              </TableHead>
              <TableHead
                className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                Role
              </TableHead>
              <TableHead
                className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[180px] flex-shrink-0`}>
                Department
              </TableHead>
              <TableHead
                className={`flex-shrink-0 w-20 bg-blue-50 ${TABLE_STYLES.headerCell} pr-6`}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((u, idx) => (
                <TableRow
                  key={u.id}
                  className={`${TABLE_STYLES.dataRow} hover:bg-blue-50/30 cursor-pointer`}
                  onClick={() => onEditUser(u)}>
                  <TableCell
                    className={`${TABLE_STYLES.rowNumber} bg-blue-50/50 flex-shrink-0 w-12`}>
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium py-4 bg-white min-w-[150px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center"
                        style={{ backgroundColor: '#3B82F618' }}>
                        <span className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{u.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm py-4 bg-gray-50/30 min-w-[120px] flex-shrink-0">
                    {u.username}
                  </TableCell>
                  <TableCell className="py-4 bg-white min-w-[200px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                    {getRoleBadge(u.role)}
                  </TableCell>
                  <TableCell className="py-4 bg-white min-w-[180px] flex-shrink-0">
                    {(() => {
                      const hasAccess = u.department_access && u.department_access.length > 0;
                      const totalDepts = departments.length;
                      const hasAllDepts = hasAccess && u.department_access?.length === totalDepts;

                      if (!hasAccess) {
                        return (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {u.department_name || 'No department'}
                            </span>
                          </div>
                        );
                      }

                      if (hasAllDepts) {
                        return (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-700">
                              All Departments
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {u.department_access?.slice(0, 3).map((d, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                {d.department_name || d.department_id}
                              </Badge>
                            ))}
                            {(u.department_access?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(u.department_access?.length || 0) - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {u.department_access?.length || 0} of {totalDepts} departments
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell
                    className={`${TABLE_STYLES.actionCell} bg-gray-50/30 flex-shrink-0 w-20`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditUser(u);
                      }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
