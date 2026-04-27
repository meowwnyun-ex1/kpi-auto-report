import React from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/Image';
import { Home, RefreshCw, Mail } from 'lucide-react';
import { ShellLayout } from '@/components/layout';

export type ErrorType =
  | '403'
  | '404'
  | '500'
  | 'network'
  | 'database'
  | 'data-error'
  | 'not-found'
  | 'connection'
  | 'timeout'
  | 'maintenance'
  | 'validation'
  | 'permission'
  | 'rate-limit'
  | 'quota-exceeded'
  | 'general'
  | 'banner-error'
  | 'trip-error'
  | 'no-data';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorConfig {
  title: string;
  message: string;
  description: string | string[];
  action?: string;
  image?: string;
  severity: ErrorSeverity;
  showRetry?: boolean;
  showHome?: boolean;
  showContact?: boolean;
  customActions?: React.ReactNode;
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  '403': {
    title: 'Access Denied',
    message: 'You do not have permission to access this page.',
    description: 'Contact your administrator if you believe this is an error.',
    action: 'Go Home',
    image: '/404.png',
    severity: 'medium',
    showRetry: false,
    showHome: true,
    showContact: true,
  },
  '404': {
    title: 'Page Not Found',
    message: 'The page does not exist.',
    description: 'Please check the URL or return to home.',
    action: 'Go Home',
    image: '/404.png',
    severity: 'low',
    showRetry: false,
    showHome: true,
    showContact: false,
  },
  'no-data': {
    title: 'No Data',
    message: 'No data available.',
    description: 'Try adjusting filters or check if data has been entered.',
    action: 'Refresh',
    image: '/found.png',
    severity: 'low',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  '500': {
    title: 'Server Error',
    message: 'Server error. Please try again.',
    description: 'Our team has been notified.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'critical',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  network: {
    title: 'Network Error',
    message: 'Unable to connect.',
    description: 'Check your internet connection.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  database: {
    title: 'Database Error',
    message: 'Database unavailable.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'data-error': {
    title: 'Data Error',
    message: 'Error processing data.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'not-found': {
    title: 'Not Found',
    message: 'Resource not found.',
    description: 'It may have been deleted or moved.',
    action: 'Go Home',
    image: '/found.png',
    severity: 'medium',
    showRetry: false,
    showHome: true,
    showContact: false,
  },
  connection: {
    title: 'Connection Error',
    message: 'Failed to connect.',
    description: 'Check your internet connection.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  timeout: {
    title: 'Timeout',
    message: 'Request took too long.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  maintenance: {
    title: 'Maintenance',
    message: 'System under maintenance.',
    description: 'We will be back shortly.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'low',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'rate-limit': {
    title: 'Rate Limited',
    message: 'Too many requests.',
    description: 'Please wait a moment.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'quota-exceeded': {
    title: 'Quota Exceeded',
    message: 'Storage limit reached.',
    description: 'Delete unused data to free space.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  validation: {
    title: 'Invalid Data',
    message: 'Data validation failed.',
    description: 'Please check your input.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  permission: {
    title: 'Access Denied',
    message: 'Permission required.',
    description: 'Contact admin for access.',
    action: 'Go Home',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: false,
    showHome: true,
    showContact: false,
  },
  general: {
    title: 'Error',
    message: 'Something went wrong.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'banner-error': {
    title: 'Images Unavailable',
    message: 'Could not load images.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'trip-error': {
    title: 'Images Unavailable',
    message: 'Could not load images.',
    description: 'Please try again.',
    action: 'Retry',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
};

interface UnifiedErrorProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  description?: string;
  severity?: ErrorSeverity;
  showRetry?: boolean;
  showHome?: boolean;
  showContact?: boolean;
  customActions?: React.ReactNode;
  onRetry?: () => void;
  onHome?: () => void;
  onContact?: () => void;
  className?: string;
  compact?: boolean;
  useShellLayout?: boolean;
}

export const UnifiedError: React.FC<UnifiedErrorProps> = ({
  type,
  title,
  message,
  description,
  severity: _severity,
  showRetry: _showRetry,
  showHome: _showHome,
  showContact: _showContact,
  customActions,
  onRetry,
  onHome,
  onContact,
  className,
  compact,
  useShellLayout = true,
}) => {
  const errorType = type || 'general';
  const config = errorConfigs[errorType];

  // Helper function to render description (string or array)
  const renderDescription = (desc: string | string[] | undefined) => {
    if (!desc) return null;

    if (Array.isArray(desc)) {
      return desc.map((line, index) => (
        <p key={index} className="mb-1 last:mb-0">
          {line}
        </p>
      ));
    }

    return <p>{desc}</p>;
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleContact = () => {
    if (onContact) {
      onContact();
    } else {
      window.location.href = 'mailto:support@example.com';
    }
  };

  const getButtonColor = (_severity: ErrorSeverity) => {
    // Primary button style (for main actions like Retry)
    return 'bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200';
  };

  const getSecondaryButtonColor = () => {
    // Secondary button style (for Home, Contact)
    return 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200';
  };

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <div className="w-32 h-32 flex items-center justify-center mb-4">
          <Image
            src={config.image}
            alt={title || config.title}
            className="object-contain"
            width={128}
            height={128}
            fallbackType="error"
          />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{title || config.title}</h3>
        <p className="text-sm text-gray-700 mb-4 font-medium">{message || config.message}</p>
        {config.showRetry && (
          <Button onClick={handleRetry} size="sm" className={getButtonColor(config.severity)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  const errorContent = (
    <div
      className={`${errorType === '404' ? 'max-w-4xl' : 'max-w-lg'} w-full flex flex-col items-center`}>
      {/* Error Icon */}
      <div className="mb-6 flex justify-center">
        <div
          className={`flex items-center justify-center ${errorType === '404' ? 'w-[32rem] h-64' : 'w-64 h-64'}`}>
          <Image
            src={config.image}
            alt={title || config.title}
            className={errorType === '404' ? 'object-contain' : 'object-contain'}
            width={errorType === '404' ? 512 : 256}
            height={errorType === '404' ? 256 : 256}
            fallbackType={errorType === '404' ? 'not-found' : 'error'}
          />
        </div>
      </div>

      {/* Error Content */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || config.title}</h1>
        <p className="text-lg text-gray-700 mb-6 font-medium">{message || config.message}</p>
        <div className="text-base text-gray-600 space-y-2">
          {renderDescription(description || config.description)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {config.showRetry && (
          <Button
            onClick={handleRetry}
            className={`${getButtonColor(config.severity)} text-base px-6 py-3 font-semibold`}>
            <RefreshCw className="w-5 h-5 mr-2" />
            {config.action || 'Try Again'}
          </Button>
        )}

        {config.showHome && (
          <Button
            onClick={handleHome}
            className={`${getSecondaryButtonColor()} text-base px-6 py-3 font-medium`}>
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
        )}

        {config.showContact && (
          <Button
            onClick={handleContact}
            className={`${getSecondaryButtonColor()} text-base px-6 py-3 font-medium`}>
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </Button>
        )}

        {customActions}
      </div>
    </div>
  );

  if (useShellLayout) {
    return (
      <ShellLayout variant="admin">
        <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center px-4 py-8">
          {errorContent}
        </div>
      </ShellLayout>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8">
      {errorContent}
    </div>
  );
};

export default UnifiedError;
