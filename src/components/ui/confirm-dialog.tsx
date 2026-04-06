import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, LogOut } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info' | 'logout';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'logout':
        return <LogOut className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive' as const;
      case 'warning':
        return 'outline' as const;
      case 'logout':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-500 shadow-lg hover:shadow-xl transition-all duration-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-500 shadow-lg hover:shadow-xl transition-all duration-200';
      case 'logout':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-gray-500 shadow-lg hover:shadow-xl transition-all duration-200';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-md">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 mx-auto">
            {getIcon()}
          </div>
          <AlertDialogTitle className="text-center text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <AlertDialogCancel asChild>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={loading}
              onClick={onCancel}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={getConfirmButtonVariant()}
              className={`w-full sm:w-auto ${getConfirmButtonClass()}`}
              onClick={onConfirm}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook for easy usage
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<ConfirmDialogProps>>({});

  const showDialog = (props: Partial<ConfirmDialogProps>) => {
    setConfig(props);
    setIsOpen(true);
  };

  const hideDialog = () => {
    setIsOpen(false);
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={config.title || 'Confirm Action'}
      description={config.description || 'Are you sure you want to proceed?'}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      onConfirm={() => {
        config.onConfirm?.();
        hideDialog();
      }}
      onCancel={() => {
        config.onCancel?.();
        hideDialog();
      }}
      variant={config.variant}
      loading={config.loading}
    />
  );

  return {
    showDialog,
    hideDialog,
    ConfirmDialogComponent,
  };
};

export default ConfirmDialog;
