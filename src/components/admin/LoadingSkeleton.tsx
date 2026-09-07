'use client';

import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'table' | 'cards' | 'kpi' | 'list';
  rows?: number;
  cols?: number;
  className?: string;
}

export default function LoadingSkeleton({
  variant = 'table',
  rows = 5,
  cols = 5,
  className = '',
}: LoadingSkeletonProps) {
  if (variant === 'kpi') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-7 bg-slate-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-pulse">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="h-6 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Default: table
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse ${className}`}>
      <div className="p-4 border-b border-slate-100">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            {Array.from({ length: cols }).map((_, c) => (
              <th key={c} className="p-3">
                <div className="h-3 bg-slate-100 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-3">
                  <div className="h-3 bg-slate-100 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
