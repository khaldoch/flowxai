import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'analytics' | 'success' | 'warning';
  className?: string;
}

export function AnalyticsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default',
  className 
}: AnalyticsCardProps) {
  const variantStyles = {
    default: 'analytics-card',
    analytics: 'analytics-gradient',
    success: 'success-gradient', 
    warning: 'warning-gradient'
  };

  return (
    <Card className={cn(variantStyles[variant], 'hover-lift', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium opacity-90">
          {title}
        </CardTitle>
        <div className="opacity-80">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-sm opacity-70 mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}