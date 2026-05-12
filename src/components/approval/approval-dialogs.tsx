/**
 * APPROVAL DIALOGS
 * Dialogs สำหรับการอนุมัติ, ปฏิเสธ, และส่งกลับให้แก้ไข
 */

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { ApprovalLevel, ApprovalEntityType } from '@/shared/types/approval';
import { APPROVAL_LEVELS, APPROVAL_ACTION_LABELS } from '@/shared/constants/approval';

// ============================================
// APPROVE DIALOG
// ============================================

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: ApprovalLevel;
  entityType: ApprovalEntityType;
  entityTitle?: string;
  onConfirm: (comments?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ApproveDialog: React.FC<ApproveDialogProps> = ({
  open,
  onOpenChange,
  level,
  entityType,
  entityTitle,
  onConfirm,
  isProcessing = false,
}) => {
  const [comments, setComments] = useState('');

  const handleConfirm = async () => {
    await onConfirm(comments.trim() || undefined);
    setComments('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setComments('');
  };

  const levelLabel = APPROVAL_LEVELS[level].labelTh;
  const actionConfig = APPROVAL_ACTION_LABELS['approve'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            อนุมัติ ({levelLabel})
          </DialogTitle>
          <DialogDescription>
            {entityTitle || `อนุมัติ${entityType} ในฐานะ${levelLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="approve-comments">
              ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
            </Label>
            <Textarea
              id="approve-comments"
              placeholder="ระบุความคิดเห็นหรือหมายเหตุ (ถ้ามี)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังอนุมัติ...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                ยืนยันการอนุมัติ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// REJECT DIALOG
// ============================================

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: ApprovalLevel;
  entityType: ApprovalEntityType;
  entityTitle?: string;
  onConfirm: (comments: string) => Promise<void>;
  isProcessing?: boolean;
}

export const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  onOpenChange,
  level,
  entityType,
  entityTitle,
  onConfirm,
  isProcessing = false,
}) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!comments.trim()) {
      setError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setError(null);
    await onConfirm(comments.trim());
    setComments('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setComments('');
    setError(null);
  };

  const levelLabel = APPROVAL_LEVELS[level].labelTh;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            ปฏิเสธ ({levelLabel})
          </DialogTitle>
          <DialogDescription>
            {entityTitle || `ปฏิเสธ${entityType} ในฐานะ${levelLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reject-comments" className="text-red-600">
              เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-comments"
              placeholder="ระบุเหตุผลในการปฏิเสธ..."
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              className={error ? 'border-red-300 focus-visible:ring-red-300' : ''}
            />
            <p className="text-xs text-muted-foreground">
              เหตุผลจะถูกส่งถึงผู้บันทึกเพื่อทราบและแก้ไข
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !comments.trim()}
            variant="destructive"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังปฏิเสธ...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                ยืนยันการปฏิเสธ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// RETURN DIALOG
// ============================================

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: ApprovalLevel;
  entityType: ApprovalEntityType;
  entityTitle?: string;
  onConfirm: (comments: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ReturnDialog: React.FC<ReturnDialogProps> = ({
  open,
  onOpenChange,
  level,
  entityType,
  entityTitle,
  onConfirm,
  isProcessing = false,
}) => {
  const [comments, setComments] = useState('');
  const [requiredChanges, setRequiredChanges] = useState<string[]>([]);
  const [newChange, setNewChange] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!comments.trim()) {
      setError('กรุณาระบุเหตุผลในการส่งกลับ');
      return;
    }

    const fullComments = requiredChanges.length > 0
      ? `${comments}\n\nสิ่งที่ต้องแก้ไข:\n${requiredChanges.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : comments;

    setError(null);
    await onConfirm(fullComments.trim());
    setComments('');
    setRequiredChanges([]);
  };

  const handleAddChange = () => {
    if (newChange.trim()) {
      setRequiredChanges([...requiredChanges, newChange.trim()]);
      setNewChange('');
    }
  };

  const handleRemoveChange = (index: number) => {
    setRequiredChanges(requiredChanges.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    onOpenChange(false);
    setComments('');
    setRequiredChanges([]);
    setError(null);
  };

  const levelLabel = APPROVAL_LEVELS[level].labelTh;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <ArrowLeft className="w-5 h-5" />
            ส่งกลับให้แก้ไข ({levelLabel})
          </DialogTitle>
          <DialogDescription>
            {entityTitle || `ส่งกลับ${entityType} ให้ผู้บันทึกแก้ไข`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="return-comments" className="text-amber-600">
              เหตุผลในการส่งกลับ <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="return-comments"
              placeholder="ระบุเหตุผลหรือข้อเสนอแนะ..."
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
              className={error ? 'border-red-300 focus-visible:ring-red-300' : ''}
            />
          </div>

          {/* Required Changes List */}
          <div className="space-y-2">
            <Label>รายการที่ต้องแก้ไข (ไม่บังคับ)</Label>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="เพิ่มรายการที่ต้องแก้ไข..."
                value={newChange}
                onChange={(e) => setNewChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChange();
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddChange}>
                เพิ่ม
              </Button>
            </div>

            {requiredChanges.length > 0 && (
              <ul className="space-y-1 mt-2">
                {requiredChanges.map((change, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 bg-amber-50 rounded text-sm"
                  >
                    <span>{index + 1}. {change}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveChange(index)}
                    >
                      ลบ
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            <p>
              เมื่อส่งกลับแล้ว ผู้บันทึกจะสามารถแก้ไขข้อมูลและส่งใหม่อีกครั้งได้
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !comments.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังส่งกลับ...
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                ยืนยันการส่งกลับ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// SUBMIT FOR APPROVAL DIALOG
// ============================================

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: ApprovalEntityType;
  entityTitle?: string;
  onConfirm: (comments?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const SubmitDialog: React.FC<SubmitDialogProps> = ({
  open,
  onOpenChange,
  entityType,
  entityTitle,
  onConfirm,
  isProcessing = false,
}) => {
  const [comments, setComments] = useState('');

  const handleConfirm = async () => {
    await onConfirm(comments.trim() || undefined);
    setComments('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setComments('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            ส่งเข้าอนุมัติ
          </DialogTitle>
          <DialogDescription>
            {entityTitle || `ส่ง${entityType} เข้าสู่ระบบอนุมัติ`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800">
            <p className="font-medium">⚠️ โปรดตรวจสอบข้อมูลก่อนส่ง</p>
            <p className="mt-1">
              เมื่อส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้จนกว่าจะถูกส่งกลับ
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-comments">
              หมายเหตุ (ไม่บังคับ)
            </Label>
            <Textarea
              id="submit-comments"
              placeholder="ระบุหมายเหตุหรือข้อมูลเพิ่มเติม..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                ยืนยันการส่ง
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// APPROVAL HISTORY DIALOG
// ============================================

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: {
    id: number;
    approvalLevel: string;
    approverName?: string;
    action: string;
    previousStatus?: string;
    newStatus?: string;
    comments?: string;
    createdAt: string;
  }[];
}

export const ApprovalHistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onOpenChange,
  history,
}) => {
  const actionColors: Record<string, string> = {
    submitted: 'text-blue-600 bg-blue-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    returned: 'text-amber-600 bg-amber-50',
    cancelled: 'text-gray-600 bg-gray-50',
    resubmitted: 'text-blue-600 bg-blue-50',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ประวัติการอนุมัติ</DialogTitle>
          <DialogDescription>
            แสดงประวัติการดำเนินการทั้งหมด
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีประวัติการอนุมัติ
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      actionColors[item.action] || 'text-gray-600 bg-gray-50'
                    )}>
                      {item.action}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {item.approverName || 'System'} ({item.approvalLevel})
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('th-TH')}
                      </span>
                    </div>
                    
                    {item.previousStatus && item.newStatus && (
                      <p className="text-sm text-muted-foreground">
                        สถานะ: {item.previousStatus} → {item.newStatus}
                      </p>
                    )}
                    
                    {item.comments && (
                      <p className="text-sm bg-gray-50 p-2 rounded mt-2">
                        {item.comments}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { cn } from '@/lib/utils';

export default {
  ApproveDialog,
  RejectDialog,
  ReturnDialog,
  SubmitDialog,
  ApprovalHistoryDialog,
};
