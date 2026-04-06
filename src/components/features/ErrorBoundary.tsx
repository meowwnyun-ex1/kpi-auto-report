import { Component, ErrorInfo, ReactNode } from 'react';
import { UnifiedError, ErrorType } from '@/components/ui/unified-error';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  errorType?: ErrorType;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  getErrorType(error?: Error): ErrorType {
    if (!error) return 'general';

    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed') ||
      message.includes('err_network') ||
      message.includes('err_connection_refused') ||
      message.includes('err_name_not_resolved') ||
      message.includes('err_internet_disconnected')
    ) {
      return 'network';
    }

    // Server errors
    if (
      message.includes('500') ||
      message.includes('internal server error') ||
      message.includes('server error')
    ) {
      return '500';
    }

    // Database errors
    if (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      stack.includes('database')
    ) {
      return 'database';
    }

    // Permission errors
    if (
      message.includes('403') ||
      message.includes('forbidden') ||
      message.includes('unauthorized') ||
      message.includes('permission')
    ) {
      return 'permission';
    }

    // Not found errors
    if (message.includes('404') || message.includes('not found')) {
      return '404';
    }

    // Rate limiting
    if (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return 'rate-limit';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return 'validation';
    }

    return 'general';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.props.errorType || this.getErrorType(this.state.error);

      return (
        <UnifiedError
          type={errorType}
          onRetry={() => window.location.reload()}
          showRetry={true}
          showHome={true}
        />
      );
    }

    return this.props.children;
  }
}
