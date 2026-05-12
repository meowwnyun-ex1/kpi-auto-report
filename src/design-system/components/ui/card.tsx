/**
 * Enterprise Card Component
 * World-class professional card with multiple variants and states
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

// ============================================
// CARD CONTEXT
// ============================================

const CardContext = React.createContext<{
  variant: 'default' | 'elevated' | 'outlined' | 'glass';
  interactive: boolean;
}>({
  variant: 'default',
  interactive: false,
});

// ============================================
// CARD VARIANTS
// ============================================

const cardVariants = {
  default: 'bg-card text-card-foreground border border-border',
  elevated: 'bg-card text-card-foreground shadow-lg border-0',
  outlined: 'bg-background text-foreground border-2 border-border',
  glass: 'bg-white/80 backdrop-blur-md text-foreground border border-white/20 shadow-xl',
};

// ============================================
// CARD COMPONENTS
// ============================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  interactive?: boolean;
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, hover = false, children, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({
      variant,
      interactive,
    }), [variant, interactive]);

    return (
      <CardContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'rounded-lg transition-all duration-200',
            cardVariants[variant],
            hover && 'hover:shadow-md hover:-translate-y-0.5',
            interactive && 'cursor-pointer active:scale-[0.98]',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean;
    bordered?: boolean;
  }
>(({ className, centered = false, bordered = false, ...props }, ref) => {
  const { variant } = React.useContext(CardContext);
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        centered && 'items-center text-center',
        bordered && 'border-b border-border',
        variant === 'glass' && 'border-b border-white/20',
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, as: As = 'h3', size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
    xl: 'text-3xl font-bold',
  };

  return (
    <As
      ref={ref}
      className={cn(
        'leading-none tracking-tight',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <p
      ref={ref}
      className={cn(
        'text-muted-foreground',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
    compact?: boolean;
  }
>(({ className, noPadding = false, compact = false, ...props }, ref) => {
  const { variant } = React.useContext(CardContext);
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex-1',
        !noPadding && (compact ? 'p-4' : 'p-6'),
        variant === 'glass' && !noPadding && 'px-6 pb-6',
        className
      )}
      {...props}
    />
  );
});
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justified?: boolean;
    bordered?: boolean;
  }
>(({ className, justified = false, bordered = false, ...props }, ref) => {
  const { variant } = React.useContext(CardContext);
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-6 pt-0',
        justified && 'justify-between',
        bordered && 'border-t border-border mt-4 pt-6',
        variant === 'glass' && 'border-t border-white/20 mt-4 pt-6',
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';

// ============================================
// SPECIALIZED CARD COMPONENTS
// ============================================

// Stats card for metrics
interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'trend' | 'progress';
  progress?: number;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ 
    className, 
    title, 
    value, 
    change, 
    icon, 
    variant = 'default',
    progress,
    ...props 
  }, ref) => {
    const changeColor = change?.type === 'increase' ? 'text-emerald-600' : 
                      change?.type === 'decrease' ? 'text-red-600' : 
                      'text-muted-foreground';

    return (
      <Card ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <p className={cn('text-sm mt-1 flex items-center gap-1', changeColor)}>
                  {change.type === 'increase' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  {change.type === 'decrease' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {Math.abs(change.value)}%
                </p>
              )}
            </div>
            {icon && (
              <div className="ml-4 p-3 bg-primary/10 rounded-lg text-primary">
                {icon}
              </div>
            )}
          </div>
          {variant === 'progress' && typeof progress === 'number' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// KPI Category card
interface KPICategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  category: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    targetCount?: number;
    achievementRate?: number;
    status?: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  };
  onClick?: () => void;
}

const KPICategoryCard = React.forwardRef<HTMLDivElement, KPICategoryCardProps>(
  ({ category, onClick, className, ...props }, ref) => {
    const statusColors = {
      excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      average: 'bg-amber-100 text-amber-800 border-amber-200',
      below_average: 'bg-orange-100 text-orange-800 border-orange-200',
      poor: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Card 
        ref={ref} 
        className={cn('cursor-pointer hover:shadow-lg transition-all duration-200', className)} 
        onClick={onClick}
        {...props}
      >
        <CardHeader className="text-center">
          <div 
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-3"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            {category.icon}
          </div>
          <CardTitle size="md">{category.name}</CardTitle>
          {category.description && (
            <CardDescription size="sm">{category.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-primary">{category.targetCount || 0}</p>
              <p className="text-xs text-muted-foreground">Targets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {category.achievementRate ? `${category.achievementRate}%` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Achievement</p>
            </div>
          </div>
          {category.status && (
            <div className={cn(
              'inline-flex px-3 py-1 rounded-full text-xs font-medium border',
              statusColors[category.status]
            )}>
              {category.status.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

KPICategoryCard.displayName = 'KPICategoryCard';

// Action Plan card
interface ActionPlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  plan: {
    title: string;
    description?: string;
    status: 'not_started' | 'in_progress' | 'on_track' | 'at_risk' | 'delayed' | 'completed';
    progress: number;
    dueDate: string;
    assignee?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  };
  onClick?: () => void;
}

const ActionPlanCard = React.forwardRef<HTMLDivElement, ActionPlanCardProps>(
  ({ plan, onClick, className, ...props }, ref) => {
    const statusColors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_track: 'bg-emerald-100 text-emerald-800',
      at_risk: 'bg-amber-100 text-amber-800',
      delayed: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    };

    const priorityColors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-500',
    };

    return (
      <Card 
        ref={ref} 
        className={cn('cursor-pointer hover:shadow-md transition-all duration-200', className)} 
        onClick={onClick}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1 line-clamp-2">{plan.title}</h4>
              {plan.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
              )}
            </div>
            <div className={cn(
              'w-2 h-2 rounded-full ml-2 mt-1',
              priorityColors[plan.priority]
            )} />
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className={cn(
              'inline-flex px-2 py-1 rounded-full text-xs font-medium',
              statusColors[plan.status]
            )}>
              {plan.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-muted-foreground">
              Due: {new Date(plan.dueDate).toLocaleDateString()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span className="font-medium">{plan.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
          
          {plan.assignee && (
            <div className="flex items-center mt-3 pt-3 border-t border-border">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary mr-2">
                {plan.assignee.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground">{plan.assignee}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

ActionPlanCard.displayName = 'ActionPlanCard';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  StatsCard,
  KPICategoryCard,
  ActionPlanCard,
};
