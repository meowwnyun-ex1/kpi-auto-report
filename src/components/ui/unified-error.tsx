import React from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/Image';
import { Home, RefreshCw, Mail } from 'lucide-react';
import { ShellLayout } from '@/features/shell';

export type ErrorType =
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
  | 'trip-error';

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
  '404': {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist or has been moved.',
    description: [
      'This could be due to a broken link, an outdated bookmark, or the page may have been removed.',
      'Please check the URL or navigate to the home page.',
    ],
    action: 'Go to Home Page',
    image: '/404.png',
    severity: 'low',
    showRetry: false,
    showHome: true,
    showContact: false,
  },
  '500': {
    title: 'Server Error',
    message: 'We are experiencing server issues. Please try again later.',
    description: [
      'Our servers are currently experiencing technical difficulties.',
      'Our team has been automatically notified and is working to resolve this issue.',
      'Please try again in a few moments.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'critical',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  network: {
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your network connection.',
    description: [
      'Check your internet connection.',
      'Try restarting your WiFi or check your connection.',
      'If the problem persists, contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  database: {
    title: 'Database Error',
    message: 'Unable to access the database. Please try again later.',
    description: [
      'The database system is temporarily experiencing issues.',
      'Your data is safe and secure.',
      'Please try again in a few moments.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  'data-error': {
    title: 'Data Error',
    message: 'There was an error processing the data.',
    description: [
      'The system encountered an issue while processing your request.',
      'This could be due to corrupted data or a temporary issue.',
      'Please try again or contact support if the problem persists.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  'not-found': {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    description: [
      'The data you are looking for does not exist in the system.',
      'Try searching with different keywords or contact support.',
      'It may have been deleted or there may have been changes.',
    ],
    action: 'Search Again',
    image: '/found.png',
    severity: 'medium',
    showRetry: true,
    showHome: true,
    showContact: false,
  },
  connection: {
    title: 'Connection Error',
    message: 'Failed to connect to the server.',
    description: [
      'Unable to connect to the server.',
      'Check your internet connection.',
      'Try refreshing the page or contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'high',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  timeout: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    description: [
      'The operation took longer than the allowed time.',
      'Try again or check your connection.',
      'If the problem persists, contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  maintenance: {
    title: 'Under Maintenance',
    message: 'The system is currently under maintenance.',
    description: [
      'The system is currently undergoing performance improvements.',
      'We will be back online shortly.',
      'Thank you for your patience during this time.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'low',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  'rate-limit': {
    title: 'Rate Limit Exceeded',
    message: 'You have made too many requests. Please try again later.',
    description: [
      'To prevent excessive system usage.',
      'Please wait a moment before trying again.',
      'If you need additional access, contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  'quota-exceeded': {
    title: 'Quota Exceeded',
    message: 'You have exceeded your quota.',
    description: [
      'You have used more space than the system allows.',
      'Try deleting unnecessary data or contact support.',
      'If you need more space, contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  validation: {
    title: 'Validation Error',
    message: 'The data you provided is invalid.',
    description: [
      'Please check the data you entered.',
      'Ensure the data is complete and correct.',
      'Try again or contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  permission: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    description: [
      'You do not have permission to access this page.',
      'Please log in with an account that has permissions.',
      'Contact support to request additional permissions.',
    ],
    action: 'Login',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: false,
    showHome: true,
    showContact: true,
  },
  general: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    description: [
      'An unexpected error occurred while processing your request.',
      'Our team has been notified.',
      'Try again or contact support.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: true,
  },
  'banner-error': {
    title: 'Banner Images Unavailable',
    message: "We couldn't load the banner images from the database.",
    description: [
      'The banner images are temporarily unavailable.',
      'This might be due to a server issue or maintenance.',
      'Please try again or contact support if the problem persists.',
    ],
    action: 'Try Again',
    image: '/sorry.png',
    severity: 'medium',
    showRetry: true,
    showHome: false,
    showContact: false,
  },
  'trip-error': {
    title: 'Trip Images Unavailable',
    message: "We couldn't load the trip images from the database.",
    description: [
      'The trip images are temporarily unavailable.',
      'This might be due to a server issue or maintenance.',
      'Please try again or contact support if the problem persists.',
    ],
    action: 'Try Again',
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
      <ShellLayout variant="sidebar">
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
