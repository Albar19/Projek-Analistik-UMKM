'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div 
      className={cn('bg-white rounded-xl shadow-sm border border-slate-200 p-6', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ title, value, change, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
              )}
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}% dari periode lalu
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'
          )}
        >
          <Icon
            className={cn(
              'w-6 h-6',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600'
            )}
          />
        </div>
      </div>
    </Card>
  );
}

interface InsightCardProps {
  type: 'increase' | 'decrease' | 'stable' | 'anomaly' | 'info';
  title: string;
  description: string;
}

export function InsightCard({ type, title, description }: InsightCardProps) {
  const styles = {
    increase: 'bg-green-50 border-green-200 text-green-800',
    decrease: 'bg-red-50 border-red-200 text-red-800',
    stable: 'bg-blue-50 border-blue-200 text-blue-800',
    anomaly: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-slate-50 border-slate-200 text-slate-800',
  };

  const icons = {
    increase: '📈',
    decrease: '📉',
    stable: '➡️',
    anomaly: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={cn('p-4 rounded-lg border', styles[type])}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1 opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showPercentage?: boolean;
}

export function ProgressBar({ value, max = 100, label, color = 'blue', showPercentage = true }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-slate-500">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
