import React from 'react';

interface ListingStatusBadgeProps {
  status: string;
}

export const ListingStatusBadge: React.FC<ListingStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200/80 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          सक्रिय
        </span>
      );
    case 'LOW_STOCK':
      return (
        <span className="bg-amber-50 text-amber-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200/80 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          कम स्टॉक
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="bg-slate-100 text-slate-600 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          समाप्त/पॉज़
        </span>
      );
    case 'SOLD_OUT':
      return (
        <span className="bg-red-50 text-red-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-red-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          बिक गया
        </span>
      );
    case 'ACCEPTED':
    case 'IN_TRANSIT':
      return (
        <span className="bg-sky-50 text-sky-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-sky-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
          {status === 'IN_TRANSIT' ? 'डिलीवरी पर' : 'स्वीकृत'}
        </span>
      );
    default:
      return (
        <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200/80 inline-flex items-center gap-1">
          {status}
        </span>
      );
  }
};
