/**
 * Approval Route V2
 * Detail view for approval workflow
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ModernShellLayout, ModernPageLayout } from '@/components/layout/modern-layout';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/config/api';

// ============================================
// TYPES
// ============================================

interface ApprovalStep {
  step: number;
  role: string;
  status: 'completed' | 'current' | 'pending' | 'waiting';
  name: string | null;
  at: string | null;
  comments?: string;
}

interface ApprovalLog {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string;
  approver_name: string | null;
  approver_role: string | null;
  comments: string | null;
  created_at: string;
}

interface EntityData {
  id: number;
  kpi_name: string;
  category_name: string;
  main_department_name: string;
  target_value?: number;
  allocated_value?: number;
  result_value?: number;
  unit?: string;
  status: string;
  year: number;
  month?: number;
  is_draft?: boolean;
  [key: string]: any;
}

// ============================================
// COMPONENT
// ============================================

const ApprovalRoutePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [entityType, setEntityType] = useState<'yearly' | 'monthly' | 'results'>('yearly');
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  // Determine entity type from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/yearly')) {
      setEntityType('yearly');
    } else if (path.includes('/monthly')) {
      setEntityType('monthly');
    } else if (path.includes('/results')) {
      setEntityType('results');
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchApprovalRoute();
    }
  }, [id, entityType]);

  const fetchApprovalRoute = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        entityType === 'yearly'
          ? `/kpi-forms/yearly/${id}/approval-route`
          : entityType === 'monthly'
            ? `/kpi-forms/monthly/${id}/approval-route`
            : `/kpi-results/${id}/approval-route`
      );
      if (response.data.success) {
        setEntity(response.data.data.target);
        setSteps(response.data.data.steps);
        setLogs(response.data.data.logs);

        // Check if current user can approve
        const currentStep = response.data.data.steps.find(
          (s: ApprovalStep) => s.status === 'current'
        );
        if (currentStep) {
          const userCanApprove =
            (currentStep.role === 'HoD' && user?.role === 'hod') ||
            (currentStep.role === 'HoS' && user?.role === 'hos') ||
            (currentStep.role === 'Admin' &&
              (user?.role === 'admin' || user?.role === 'superadmin'));
          setCanApprove(userCanApprove);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load approval route',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await api.post(`/approvals/${entityType}/${id}/approve`, {
        comments: comments.trim() || undefined,
      });

      toast({ title: 'Approved', description: 'Item approved successfully' });
      setShowApproveDialog(false);
      setComments('');
      fetchApprovalRoute();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: 'Comments Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/approvals/${entityType}/${id}/reject`, {
        comments: comments.trim(),
      });

      toast({ title: 'Rejected', description: 'Item rejected' });
      setShowRejectDialog(false);
      setComments('');
      fetchApprovalRoute();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      pending: 'bg-amber-100 text-amber-600',
      hod_approved: 'bg-blue-100 text-blue-600',
      hos_approved: 'bg-purple-100 text-purple-600',
      approved: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
      partial_complete: 'bg-amber-100 text-amber-600',
      pending_approval: 'bg-blue-100 text-blue-600',
      full_complete: 'bg-green-100 text-green-600',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'current':
        return 'bg-amber-50 border-amber-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <ModernShellLayout>
        <ModernPageLayout title="Loading...">
          <div className="text-center py-12">Loading...</div>
        </ModernPageLayout>
      </ModernShellLayout>
    );
  }

  if (!entity) {
    return (
      <ModernShellLayout>
        <ModernPageLayout title="Not Found">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Item not found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </ModernPageLayout>
      </ModernShellLayout>
    );
  }

  return (
    <ModernShellLayout>
      <ModernPageLayout title="Approval Route">
        {/* Back Button */}
        <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Entity Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entity.category_color || '#3B82F6' }}
                />
                {entity.kpi_name}
              </CardTitle>
              <Badge className={getStatusBadge(entity.status)}>
                {entity.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{entity.category_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{entity.main_department_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium">{entity.year}</p>
              </div>
              {entity.month && (
                <div>
                  <p className="text-sm text-gray-500">Month</p>
                  <p className="font-medium">{entity.month}</p>
                </div>
              )}
              {entity.target_value && (
                <div>
                  <p className="text-sm text-gray-500">Target Value</p>
                  <p className="font-medium">
                    {entity.target_value} {entity.unit}
                  </p>
                </div>
              )}
              {entity.allocated_value && (
                <div>
                  <p className="text-sm text-gray-500">Allocated</p>
                  <p className="font-medium">
                    {entity.allocated_value} {entity.unit}
                  </p>
                </div>
              )}
              {entity.result_value !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Result</p>
                  <p
                    className={cn(
                      'font-medium',
                      entity.result_value === entity.target_value
                        ? 'text-green-600'
                        : 'text-amber-600'
                    )}>
                    {entity.result_value} {entity.unit}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canApprove && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="text-red-600 hover:text-red-700">
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-blue-600" />
              Approval Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.step}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                    getStepColor(step.status)
                  )}>
                  <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Step {step.step}: {step.role}
                      </span>
                      {step.status === 'current' && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Current
                        </Badge>
                      )}
                    </div>
                    {step.name && (
                      <p className="text-sm text-gray-600 mt-1">
                        <User className="w-3 h-3 inline mr-1" />
                        {step.name}
                      </p>
                    )}
                    {step.at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(step.at).toLocaleString()}
                      </p>
                    )}
                    {step.comments && (
                      <p className="text-sm text-gray-600 mt-2 bg-white/50 p-2 rounded">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {step.comments}
                      </p>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block text-gray-300">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Approval History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No approval history yet</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {log.action === 'approve' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : log.action === 'reject' ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <Send className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-gray-400">•</span>
                        <Badge variant="outline" className="text-xs">
                          {log.approver_role?.toUpperCase()}
                        </Badge>
                        {log.approver_name && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{log.approver_name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.from_status && (
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {log.from_status} → {log.to_status}
                        </p>
                      )}
                      {log.comments && (
                        <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded">
                          {log.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">Are you sure you want to approve this item?</p>
              <div>
                <label className="text-sm font-medium mb-2 block">Comments (Optional)</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700">
                {submitting ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">Please provide a reason for rejection.</p>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason * <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={submitting || !comments.trim()}
                variant="destructive">
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ModernPageLayout>
    </ModernShellLayout>
  );
};

export default ApprovalRoutePage;
