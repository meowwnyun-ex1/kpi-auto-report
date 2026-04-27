/**
 * Base Component
 * Component พื้นฐานที่ใช้มาตรฐานระบบทั้งหมด
 */

import React from 'react';

// ============================================
// BASE COMPONENT PROPS
// ============================================

interface BaseComponentProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  validation?: boolean;
}

// ============================================
// BASE COMPONENT
// ============================================

export function BaseComponent({ children, className = '', testId }: BaseComponentProps) {
  return (
    <div
      className={`p-4 bg-white rounded-lg border border-gray-200 ${className}`}
      data-testid={testId}>
      {children}
    </div>
  );
}

// ============================================
// BASE PAGE COMPONENT
// ============================================

interface BasePageProps extends BaseComponentProps {
  title: string;
  pageName: keyof typeof import('@/constants/system-standards').PAGE_THEMES;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function BasePage({ children, title, className = '', testId }: BasePageProps) {
  return (
    <div className={`p-6 ${className}`} data-testid={testId}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {children}
    </div>
  );
}

// ============================================
// BASE SECTION COMPONENT
// ============================================

interface BaseSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function BaseSection({
  children,
  title,
  description,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  testId,
}: BaseSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={`space-y-4 ${className}`} data-testid={testId}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              {collapsible && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  {isCollapsed ? 'แสดง' : 'ซ่อน'}
                </button>
              )}
            </div>
          )}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {!isCollapsed && children}
    </div>
  );
}

// ============================================
// BASE GRID COMPONENT
// ============================================

interface BaseGridProps extends BaseComponentProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export function BaseGrid({
  children,
  cols = 3,
  gap = 'md',
  responsive = true,
  className = '',
  testId,
}: BaseGridProps) {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap];

  // สร้างคลาส cols
  const colsClasses = responsive
    ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`
    : `grid grid-cols-${cols}`;

  const combinedClasses = `${colsClasses} ${gapClasses} ${className}`.trim();

  return (
    <div className={combinedClasses} data-testid={testId}>
      {children}
    </div>
  );
}

// ============================================
// BASE TABLE COMPONENT
// ============================================

interface BaseTableProps extends BaseComponentProps {
  headers: string[];
  data: any[][];
  theme?: 'gray' | 'blue' | 'emerald' | 'red' | 'orange';
}

export function BaseTable({
  headers,
  data,
  theme = 'gray',
  className = '',
  testId,
}: BaseTableProps) {
  const { getStandard } = useSystemStandards();

  // ดึงค่ามาตรฐาน table
  const tableClasses = getStandard('components.tables') || '';
  const combinedClasses = `${tableClasses} ${className}`.trim();

  // Theme colors
  const themeColors = {
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
  }[theme];

  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className={`w-full ${combinedClasses}`}>
        <thead>
          <tr className={themeColors}>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// BASE FORM COMPONENT
// ============================================

interface BaseFormProps extends BaseComponentProps {
  onSubmit?: (data: any) => void;
  disabled?: boolean;
}

export function BaseForm({
  children,
  onSubmit,
  disabled = false,
  className = '',
  testId,
}: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !disabled) {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} data-testid={testId}>
      {children}
    </form>
  );
}

// ============================================
// BASE LOADING COMPONENT
// ============================================

interface BaseLoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'spinner' | 'pulse' | 'dots';
}

export function BaseLoading({
  size = 'md',
  type = 'spinner',
  className = '',
  testId,
}: BaseLoadingProps) {
  const { getStandard } = useSystemStandards();

  // ดึงค่ามาตรฐาน animation
  const animationClasses = getStandard(`animations.loading.${type}`) || '';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const combinedClasses = `${sizeClasses} ${animationClasses} ${className}`.trim();

  if (type === 'spinner') {
    return (
      <div
        className={`border-2 border-gray-300 border-t-blue-600 rounded-full ${combinedClasses}`}
        data-testid={testId}
      />
    );
  }

  if (type === 'pulse') {
    return <div className={`bg-gray-300 rounded ${combinedClasses}`} data-testid={testId} />;
  }

  if (type === 'dots') {
    return (
      <div className={`flex gap-1 ${className}`} data-testid={testId}>
        <div className={`w-2 h-2 bg-blue-600 rounded-full ${animationClasses}`} />
        <div
          className={`w-2 h-2 bg-blue-600 rounded-full ${animationClasses}`}
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className={`w-2 h-2 bg-blue-600 rounded-full ${animationClasses}`}
          style={{ animationDelay: '0.2s' }}
        />
      </div>
    );
  }

  return null;
}

// ============================================
// BASE ERROR BOUNDARY
// ============================================

interface BaseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface BaseErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class BaseErrorBoundary extends React.Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BaseErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <h3 className="text-red-800 font-medium mb-2">เกิดข้อผิดพลาด</h3>
      <p className="text-red-600 text-sm mb-4">{error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}</p>
      <button onClick={reset} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        ลองใหม่
      </button>
    </div>
  );
}
