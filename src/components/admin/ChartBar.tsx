'use client';

import React from 'react';

export interface ChartBarProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  showLabels?: boolean;
  className?: string;
  emptyText?: string;
}

export function ChartBar({
  data,
  maxValue,
  height = 120,
  showValues = true,
  showLabels = true,
  className = '',
  emptyText = 'No data',
}: ChartBarProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-400 ${className}`} style={{ height }}>
        {emptyText}
      </div>
    );
  }

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex items-end gap-1.5 ${className}`} style={{ height: height + (showLabels ? 28 : 0) }}>
      {data.map((item, idx) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        const barColor = item.color || '#15803D';

        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center gap-1 group"
            title={`${item.label}: ${item.value.toLocaleString('en-IN')}`}
          >
            {showValues && (
              <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value > 999 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </span>
            )}
            <div
              className="w-full rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(pct, 2)}%`,
                maxHeight: height,
                backgroundColor: barColor,
                opacity: 0.85,
              }}
            />
            {showLabels && (
              <span
                className="text-[9px] font-semibold text-slate-500 text-center leading-tight truncate w-full text-center"
                style={{ maxWidth: '100%' }}
              >
                {item.label.length > 6 ? item.label.slice(0, 5) + '…' : item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ChartBar;

/* ---- Horizontal bar (for status breakdowns) ---- */
export interface HBarItem {
  label: string;
  value: number;
  color?: string;
  total?: number;
}

export interface HBarProps {
  label?: string;
  value?: number;
  total?: number;
  color?: string;
  className?: string;
  data?: HBarItem[];
}

export function HorizontalBar({
  label,
  value,
  total,
  color = '#15803D',
  className = '',
  data,
}: HBarProps) {
  if (data && Array.isArray(data)) {
    const computedTotal = total || data.reduce((sum, item) => sum + item.value, 0) || 100;
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, idx) => {
          const itemTotal = item.total || computedTotal;
          const pct = itemTotal > 0 ? Math.min((item.value / itemTotal) * 100, 100) : 0;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {item.value.toLocaleString('en-IN')}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color || '#15803D' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const pct = (total && total > 0 && value) ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-bold text-slate-900 dark:text-white tabular-nums">{(value || 0).toLocaleString('en-IN')}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
