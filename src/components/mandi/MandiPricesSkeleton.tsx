import React from 'react';

/**
 * Animated Shimmer Skeleton for Mandi Commodity Benchmark Cards
 */
export const MandiCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse" id="mandi-cards-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-emerald-100 rounded w-12" />
          </div>
          {/* Price */}
          <div className="h-7 bg-slate-200 rounded w-28 my-2" />
          {/* Subtext */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
            <div className="h-3 bg-slate-100 rounded w-20" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Animated Shimmer Skeleton for APMC Mandi Rates Table
 */
export const MandiTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-pulse" id="mandi-table-skeleton">
      {/* Table Header skeleton */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="h-4 bg-slate-200 rounded w-48" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-36" />
      </div>

      {/* Table rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 w-1/4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-slate-200 rounded w-24" />
                <div className="h-2.5 bg-slate-100 rounded w-16" />
              </div>
            </div>

            <div className="w-1/4 space-y-1.5 hidden sm:block">
              <div className="h-3.5 bg-slate-200 rounded w-28" />
              <div className="h-2.5 bg-slate-100 rounded w-20" />
            </div>

            <div className="w-1/6 space-y-1.5 hidden md:block">
              <div className="h-3.5 bg-slate-200 rounded w-16" />
            </div>

            <div className="w-1/6 space-y-1 text-right">
              <div className="h-4 bg-emerald-100 rounded w-20 ml-auto" />
              <div className="h-2.5 bg-slate-100 rounded w-14 ml-auto" />
            </div>

            <div className="w-24 shrink-0 text-right">
              <div className="h-5 bg-slate-200 rounded-full w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Animated Shimmer Skeleton for Quick Mandi Bar on Portal Dashboard
 */
export const MandiMiniBarSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs animate-pulse" id="mandi-mini-bar-skeleton">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="h-3.5 bg-slate-200 rounded w-44" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="h-3.5 bg-slate-300 rounded w-20" />
            </div>
            <div className="h-4 bg-emerald-100 rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  );
};
