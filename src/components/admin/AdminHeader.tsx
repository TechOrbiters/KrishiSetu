'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from './AdminGuard';
import { LanguageSelector } from '../common/LanguageSelector';

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AdminHeader({
  onToggleMobileMenu,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const { session } = useAdminAuth();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const d = new Date();
    setCurrentDate(
      d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DoCA Live Marketplace Engine • PS 26033</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden md:inline">Sync Data</span>
          </button>
        )}

        {/* Date string */}
        {currentDate && (
          <div className="hidden md:block text-xs font-medium text-slate-500 dark:text-slate-400">
            {currentDate}
          </div>
        )}

        {/* System Alerts link */}
        <Link
          href="/admin/alerts"
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="View System Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
        </Link>

        {/* Language Selector */}
        <LanguageSelector variant="light" showLabel={false} />

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Admin Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
              {session?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              DoCA Officer
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
