/**
 * APPROVAL DASHBOARD
 * หน้าหลักสำหรับผู้อนุมัติ - แสดงรายการรออนุมัติและสถิติ
 */

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  AlertTriangle,
  BarChart3,
  Users,
  Shield,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useApproval,
  ApprovalStatusBadge,
  ApprovalActionButtons,
  ApproverLevelBadge,
  ApproveDialog,
  RejectDialog,
  ReturnDialog,
  ApprovalHistoryDialog,
} from '@/components/approval';
import type { ApprovalLevel, PendingApprovalItem } from '@/shared/types/approval';
import { cn } from '@/lib/utils';

// ============================================
// PENDING COUNT CARD
// ============================================

const PendingCountCard: React.FC<{
  level: ApprovalLevel;
  count: number;
  onClick: () => void;
  isActive: boolean;
}> = ({ level, count, onClick, isActive }) => {
  const levelConfig: Record<ApprovalLevel, { label: string; icon: React.ComponentType; color: string }> = {
    user: { label: 'ผู้บันทึก', icon: Users, color: 'bg-gray-100' },
    hos: { label: 'Head of Section', icon: Shield, color: 'bg-blue-50' },
    hod: { label: 'Head of Department', icon: Users, color: 'bg-purple-50' },
    admin: { label: 'Administrator', icon: Shield, color: 'bg-green-50' },
    superadmin: { label: 'Super Admin', icon: Shield, color: 'bg-red-50' },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isActive && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{config.label}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          </div>
          {count > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              รอดำเนินการ
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// PENDING ITEMS TABLE
// ============================================

const PendingItemsTable: React.FC<{
  items: PendingApprovalItem[];
  onApprove: (item: PendingApprovalItem) => void;
  onReject: (item: PendingApprovalItem) => void;
  onReturn: (item: PendingApprovalItem) => void;
  onView: (item: PendingApprovalItem) => void;
}> = ({ items, onApprove, onReject, onReturn, onView }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
        <p className="text-lg font-medium">ไม่มีรายการรออนุมัติ</p>
        <p className="text-sm">ทุกรายการได้รับการดำเนินการแล้ว</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>แผนก / หมวดหมู่</TableHead>
            <TableHead>รายการ</TableHead>
            <TableHead>ปีงบประมาณ</TableHead>
            <TableHead>ผู้ส่ง</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>รอมาแล้ว</TableHead>
            <TableHead className="text-right">การดำเนินการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                item.isUrgent && 'bg-red-50/50',
                'hover:bg-gray-50'
              )}
            >
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.departmentName}</p>
                  <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.measurement || item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.entityType.replace('_', ' ')}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p>FY{item.fiscalYear}</p>
                  {item.month && (
                    <p className="text-sm text-muted-foreground">เดือน {item.month}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{item.submittedByName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.submittedAt).toLocaleDateString('th-TH')}
                </p>
              </TableCell>
              <TableCell>
                <ApprovalStatusBadge
                  status={item.status}
                  size="sm"
                  language="th"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <span className={cn(item.isUrgent && 'text-red-600 font-medium')}>
                    {item.daysPending} วัน
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(item)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => onApprove(item)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-700"
                    onClick={() => onReturn(item)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onReject(item)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

const ApprovalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [activeLevel, setActiveLevel] = useState<ApprovalLevel>('hos');
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user approval level
  const userLevel: ApprovalLevel = useMemo(() => {
    if (user?.role === 'hos') return 'hos';
    if (user?.role === 'hod') return 'hod';
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'superadmin') return 'superadmin';
    return 'user';
  }, [user?.role]);

  // Use approval hook
  const {
    pendingApprovals,
    history,
    isLoading,
    refresh,
    approve,
    reject,
    returnForChanges,
    loadPending,
    loadHistory,
  } = useApproval({
    entityType: 'yearly_target',
    userLevel,
  });

  // Pending counts by level
  const pendingCounts = useMemo(() => {
    return {
      hos: pendingApprovals.filter(i => i.status === 'pending').length,
      hod: pendingApprovals.filter(i => i.status === 'hos_approved').length,
      admin: pendingApprovals.filter(i => i.status === 'hod_approved').length,
    };
  }, [pendingApprovals]);

  // Filter items by active level
  const filteredItems = useMemo(() => {
    if (activeLevel === 'hos') {
      return pendingApprovals.filter(i => i.status === 'pending');
    }
    if (activeLevel === 'hod') {
      return pendingApprovals.filter(i => i.status === 'hos_approved');
    }
    if (activeLevel === 'admin') {
      return pendingApprovals.filter(i => i.status === 'hod_approved');
    }
    return pendingApprovals;
  }, [pendingApprovals, activeLevel]);

  // Load data on mount
  useEffect(() => {
    loadPending({ level: userLevel });
  }, [userLevel, loadPending]);

  // Handlers
  const handleRefresh = async () => {
    await loadPending({ level: userLevel });
    toast({
      title: 'รีเฟรชแล้ว',
      description: 'อัพเดตรายการล่าสุด',
    });
  };

  const handleApprove = (item: PendingApprovalItem) => {
    setSelectedItem(item);
    setShowApproveDialog(true);
  };

  const handleReject = (item: PendingApprovalItem) => {
    setSelectedItem(item);
    setShowRejectDialog(true);
  };

  const handleReturn = (item: PendingApprovalItem) => {
    setSelectedItem(item);
    setShowReturnDialog(true);
  };

  const handleView = (item: PendingApprovalItem) => {
    // Load history for this item
    loadHistory();
    setShowHistoryDialog(true);
  };

  const handleConfirmApprove = async (comments?: string) => {
    if (!selectedItem) return;

    setIsProcessing(true);
    const success = await approve(activeLevel, { comments });
    setIsProcessing(false);

    if (success) {
      setShowApproveDialog(false);
      await loadPending({ level: userLevel });
    }
  };

  const handleConfirmReject = async (comments: string) => {
    if (!selectedItem) return;

    setIsProcessing(true);
    const success = await reject(activeLevel, comments);
    setIsProcessing(false);

    if (success) {
      setShowRejectDialog(false);
      await loadPending({ level: userLevel });
    }
  };

  const handleConfirmReturn = async (comments: string) => {
    if (!selectedItem) return;

    setIsProcessing(true);
    const success = await returnForChanges(activeLevel, comments);
    setIsProcessing(false);

    if (success) {
      setShowReturnDialog(false);
      await loadPending({ level: userLevel });
    }
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title="หน้าอนุมัติ (Approval Dashboard)"
        icon={Shield}
        description="จัดการรายการรออนุมัติและตรวจสอบสถานะ"
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            รีเฟรช
          </Button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PendingCountCard
            level="hos"
            count={pendingCounts.hos}
            onClick={() => setActiveLevel('hos')}
            isActive={activeLevel === 'hos'}
          />
          <PendingCountCard
            level="hod"
            count={pendingCounts.hod}
            onClick={() => setActiveLevel('hod')}
            isActive={activeLevel === 'hod'}
          />
          <PendingCountCard
            level="admin"
            count={pendingCounts.admin}
            onClick={() => setActiveLevel('admin')}
            isActive={activeLevel === 'admin'}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeLevel} onValueChange={(v) => setActiveLevel(v as ApprovalLevel)}>
          <TabsList className="mb-4">
            <TabsTrigger value="hos">Head of Section</TabsTrigger>
            <TabsTrigger value="hod">Head of Department</TabsTrigger>
            <TabsTrigger value="admin">Administrator</TabsTrigger>
          </TabsList>

          <TabsContent value={activeLevel}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  รายการรออนุมัติ ({filteredItems.length})
                </CardTitle>
                <CardDescription>
                  แสดงรายการที่รอการอนุมัติในขั้นตอน
                  {' '}
                  <ApproverLevelBadge level={activeLevel} />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingItemsTable
                  items={filteredItems}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onReturn={handleReturn}
                  onView={handleView}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedItem && (
          <>
            <ApproveDialog
              open={showApproveDialog}
              onOpenChange={setShowApproveDialog}
              level={activeLevel}
              entityType={selectedItem.entityType}
              entityTitle={selectedItem.measurement || selectedItem.title}
              onConfirm={handleConfirmApprove}
              isProcessing={isProcessing}
            />

            <RejectDialog
              open={showRejectDialog}
              onOpenChange={setShowRejectDialog}
              level={activeLevel}
              entityType={selectedItem.entityType}
              entityTitle={selectedItem.measurement || selectedItem.title}
              onConfirm={handleConfirmReject}
              isProcessing={isProcessing}
            />

            <ReturnDialog
              open={showReturnDialog}
              onOpenChange={setShowReturnDialog}
              level={activeLevel}
              entityType={selectedItem.entityType}
              entityTitle={selectedItem.measurement || selectedItem.title}
              onConfirm={handleConfirmReturn}
              isProcessing={isProcessing}
            />

            <ApprovalHistoryDialog
              open={showHistoryDialog}
              onOpenChange={setShowHistoryDialog}
              history={history.map(h => ({
                ...h,
                approverName: h.approverName || 'Unknown',
                createdAt: h.createdAt,
              }))}
            />
          </>
        )}
      </StandardPageLayout>
    </ShellLayout>
  );
};

import { useMemo } from 'react';

export default ApprovalDashboardPage;
