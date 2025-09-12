import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  trend?: {
    value: number;
    period: string;
  };
  bgColor?: string;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBgColor,
  description,
  trend,
  bgColor = 'bg-white'
}) => {
  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'positive':
        return 'text-accent-green';
      case 'negative':
        return 'text-accent-red';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${bgColor} overflow-hidden shadow-soft rounded-xl p-6 transition-all hover:shadow-medium`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
            </h3>
            {subtitle && (
              <span className="text-sm text-gray-500">{subtitle}</span>
            )}
          </div>
          {change && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}>
              {getChangeIcon()}
              <span>{change.value}</span>
            </div>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
          {trend && (
            <p className="mt-1 text-xs text-gray-400">
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${iconBgColor || 'bg-gray-100'} p-3 rounded-lg`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};