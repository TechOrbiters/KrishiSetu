'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = '480px',
}: DetailDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed right-0 top-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-right"
        style={{ width, maxWidth: '100vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-black text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

/* ---- Drawer section helper ---- */
interface DrawerSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DrawerSection({ title, children, className = '' }: DrawerSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>
      {title && <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </div>
  );
}

/* ---- Field row in drawer ---- */
interface FieldProps {
  label: string;
  value: React.ReactNode;
}

export function DrawerField({ label, value }: FieldProps) {
  return (
    <div className="flex items-start justify-between py-2 gap-4">
      <span className="text-xs font-semibold text-slate-500 flex-shrink-0 w-32">{label}</span>
      <span className="text-xs font-bold text-slate-900 text-right flex-1">{value ?? '—'}</span>
    </div>
  );
}
