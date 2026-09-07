'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage, positive = up, negative = down
  trendLabel?: string;
  icon?: React.ReactNode | React.ElementType;
  variant?: 'emerald' | 'teal' | 'blue' | 'amber' | 'rose' | 'slate';
  accentColor?: string; // tailwind bg class
  valuePrefix?: string;
  valueSuffix?: string;
  loading?: boolean;
  className?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = 'emerald',
  accentColor,
  valuePrefix,
  valueSuffix,
  loading = false,
  className = '',
}: KpiCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend !== undefined && trend === 0;

  const variantMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400' },
    slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  };

  const currentVariant = variantMap[variant] || variantMap.emerald;
  const containerBg = accentColor || currentVariant.bg;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ElementType;
    return <IconComponent className={`w-4 h-4 ${currentVariant.text}`} />;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 animate-pulse ${className}`}>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3 mb-3" />
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl ${containerBg} flex items-center justify-center flex-shrink-0`}>
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        {valuePrefix && <span className="text-lg font-bold text-slate-500 leading-tight">{valuePrefix}</span>}
        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </span>
        {valueSuffix && <span className="text-sm font-semibold text-slate-500 mb-0.5">{valueSuffix}</span>}
      </div>

      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                : trendNegative
                ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {trendPositive && <TrendingUp className="w-3 h-3" />}
            {trendNegative && <TrendingDown className="w-3 h-3" />}
            {trendNeutral && <Minus className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>}
        {trendLabel && <span className="text-[11px] text-slate-400">{trendLabel}</span>}
      </div>
    </div>
  );
}
