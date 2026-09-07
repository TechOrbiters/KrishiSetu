'use client';

import React from 'react';

type StatusVariant =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ACTIVE'
  | 'LOW_STOCK'
  | 'SOLD_OUT'
  | 'INACTIVE'
  | 'SCHEDULED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'FAILED'
  | 'VERIFIED'
  | 'PENDING'
  | 'REJECTED'
  | 'ONLINE'
  | 'OFFLINE'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Orders
  PLACED:        { label: 'Placed',       className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED:      { label: 'Accepted',     className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PACKED:        { label: 'Packed',       className: 'bg-purple-50 text-purple-700 border-purple-200' },
  DISPATCHED:    { label: 'Dispatched',   className: 'bg-orange-50 text-orange-700 border-orange-200' },
  IN_TRANSIT:    { label: 'In Transit',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  DELIVERED:     { label: 'Delivered',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED:     { label: 'Cancelled',    className: 'bg-red-50 text-red-700 border-red-200' },
  EXPIRED:       { label: 'Expired',      className: 'bg-slate-100 text-slate-500 border-slate-200' },
  // Listings
  ACTIVE:        { label: 'Active',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LOW_STOCK:     { label: 'Low Stock',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  SOLD_OUT:      { label: 'Sold Out',     className: 'bg-red-50 text-red-700 border-red-200' },
  INACTIVE:      { label: 'Inactive',     className: 'bg-slate-100 text-slate-500 border-slate-200' },
  ORDER_RECEIVED:{ label: 'Order Rcvd',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  // Shipments
  SCHEDULED:     { label: 'Scheduled',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PICKED_UP:     { label: 'Picked Up',    className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  OUT_FOR_DELIVERY: { label: 'Out for Del.', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAILED:        { label: 'Failed',       className: 'bg-red-50 text-red-700 border-red-200' },
  // Verification
  VERIFIED:      { label: 'Verified',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING:       { label: 'Pending',      className: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED:      { label: 'Rejected',     className: 'bg-red-50 text-red-700 border-red-200' },
  // System
  ONLINE:        { label: 'Online',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OFFLINE:       { label: 'Offline',      className: 'bg-red-50 text-red-700 border-red-200' },
  HEALTHY:       { label: 'Healthy',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DEGRADED:      { label: 'Degraded',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  UNAVAILABLE:   { label: 'Unavailable',  className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status?.replace(/_/g, ' ') || 'Unknown',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md border ${sizeClass} ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
