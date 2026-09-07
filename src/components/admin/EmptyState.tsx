'use client';

import React from 'react';
import { PackageOpen, Users, ShoppingBag, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'data' | 'users' | 'orders' | 'alert' | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const ICONS = {
  data: <PackageOpen className="w-10 h-10 text-slate-300" />,
  users: <Users className="w-10 h-10 text-slate-300" />,
  orders: <ShoppingBag className="w-10 h-10 text-slate-300" />,
  alert: <AlertCircle className="w-10 h-10 text-slate-300" />,
};

export default function EmptyState({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  icon = 'data',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4">
        {typeof icon === 'string' ? ICONS[icon as keyof typeof ICONS] : icon}
      </div>
      <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 font-medium max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---- Error State ---- */
interface ErrorStateProps {
  title?: string;
  description?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  message = 'Failed to load data.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  const detailText = description || message;

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 font-medium max-w-xs mb-4">{detailText}</p>
      {onRetry && (
        <button
          onClick={() => onRetry()}
          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
