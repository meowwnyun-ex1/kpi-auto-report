import React, { useState } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
  Clock,
} from 'lucide-react';

interface CRUDLog {
  id: number;
  timestamp: string;
  user: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  module: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

const mockLogs: CRUDLog[] = [
  {
    id: 1,
    timestamp: '2026-04-06 10:45:23',
    user: 'admin',
    action: 'CREATE',
    module: 'Users',
    entity: 'User',
    entityId: '5',
    details: 'Created new user: john.doe@denso.com',
    ipAddress: '192.168.1.100',
  },
  {
    id: 2,
    timestamp: '2026-04-06 10:30:15',
    user: 'manager1',
    action: 'UPDATE',
    module: 'KPI Safety',
    entity: 'Data Entry',
    entityId: 'SAF-2026-001',
    details: 'Updated safety incident report for March 2026',
    ipAddress: '192.168.1.105',
  },
  {
    id: 3,
    timestamp: '2026-04-06 09:15:42',
    user: 'admin',
    action: 'DELETE',
    module: 'Users',
    entity: 'User',
    entityId: '4',
    details: 'Deleted inactive user: bob.johnson@denso.com',
    ipAddress: '192.168.1.100',
  },
  {
    id: 4,
    timestamp: '2026-04-05 16:20:30',
    user: 'user1',
    action: 'READ',
    module: 'Dashboard',
    entity: 'Report',
    entityId: 'RPT-2026-Q1',
    details: 'Downloaded Q1 2026 KPI Summary Report',
    ipAddress: '192.168.1.110',
  },
  {
    id: 5,
    timestamp: '2026-04-05 14:30:00',
    user: 'manager1',
    action: 'CREATE',
    module: 'KPI Quality',
    entity: 'Metric',
    entityId: 'QLT-2026-015',
    details: 'Added new quality metric: Customer Complaint Rate',
    ipAddress: '192.168.1.105',
  },
  {
    id: 6,
    timestamp: '2026-04-05 11:45:18',
    user: 'admin',
    action: 'UPDATE',
    module: 'System',
    entity: 'Settings',
    entityId: 'SYS-001',
    details: 'Updated system notification settings',
    ipAddress: '192.168.1.100',
  },
  {
    id: 7,
    timestamp: '2026-04-04 15:30:45',
    user: 'user2',
    action: 'READ',
    module: 'KPI Delivery',
    entity: 'Dashboard',
    entityId: 'DEL-2026-03',
    details: 'Viewed delivery performance dashboard',
    ipAddress: '192.168.1.115',
  },
  {
    id: 8,
    timestamp: '2026-04-04 10:20:33',
    user: 'manager1',
    action: 'UPDATE',
    module: 'KPI HR',
    entity: 'Data Entry',
    entityId: 'HR-2026-008',
    details: 'Updated employee training completion rate',
    ipAddress: '192.168.1.105',
  },
  {
    id: 9,
    timestamp: '2026-04-03 09:00:00',
    user: 'admin',
    action: 'CREATE',
    module: 'Users',
    entity: 'Role',
    entityId: 'ROLE-005',
    details: 'Created new role: Quality Manager',
    ipAddress: '192.168.1.100',
  },
  {
    id: 10,
    timestamp: '2026-04-02 14:15:22',
    user: 'user1',
    action: 'DELETE',
    module: 'KPI Cost',
    entity: 'Entry',
    entityId: 'COST-2026-012',
    details: 'Removed duplicate cost entry',
    ipAddress: '192.168.1.110',
  },
];

export default function AdminLogs() {
  const [logs, setLogs] = useState<CRUDLog[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const modules = [...new Set(logs.map((log) => log.module))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);

    return matchesSearch && matchesAction && matchesModule && matchesDate;
  });

  const getActionBadge = (action: CRUDLog['action']) => {
    const styles = {
      CREATE: { bg: 'bg-green-100', text: 'text-green-700', icon: Plus },
      READ: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
      UPDATE: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Edit },
      DELETE: { bg: 'bg-red-100', text: 'text-red-700', icon: Trash2 },
    };
    const style = styles[action];
    const Icon = style.icon;

    return (
      <Badge className={`${style.bg} ${style.text} gap-1`}>
        <Icon className="h-3 w-3" />
        {action}
      </Badge>
    );
  };

  const handleExport = () => {
    const csv = [
      'ID,Timestamp,User,Action,Module,Entity,Entity ID,Details,IP Address',
      ...filteredLogs.map(
        (log) =>
          `${log.id},${log.timestamp},${log.user},${log.action},${log.module},${log.entity},${log.entityId},"${log.details}",${log.ipAddress}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crud-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    // In real app, this would fetch new logs from API
    console.log('Refreshing logs...');
  };

  const actionCounts = {
    CREATE: logs.filter((l) => l.action === 'CREATE').length,
    READ: logs.filter((l) => l.action === 'READ').length,
    UPDATE: logs.filter((l) => l.action === 'UPDATE').length,
    DELETE: logs.filter((l) => l.action === 'DELETE').length,
  };

  return (
    <ShellLayout variant="user">
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-sky-900">
                CRUD Log
              </h1>
              <p className="text-muted-foreground mt-1">
                Track all create, read, update, and delete operations in the system
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Create Operations</CardTitle>
              <Plus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{actionCounts.CREATE}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read Operations</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{actionCounts.READ}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Update Operations</CardTitle>
              <Edit className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{actionCounts.UPDATE}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delete Operations</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{actionCounts.DELETE}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {log.timestamp.split(' ')[0]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {log.timestamp.split(' ')[1]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {log.user}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.module}</Badge>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="font-mono text-sm">{log.entityId}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
