'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Truck,
  TrendingUp,
  BarChart3,
  Sparkles,
  AlertCircle,
  Settings,
  LogOut,
  Shield,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAdminAuth } from './AdminGuard';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Core Control',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Farmers & FPOs', href: '/admin/farmers', icon: Users },
      { label: 'Buyers Directory', href: '/admin/buyers', icon: ShoppingBag },
      { label: 'Orders & Escrow', href: '/admin/orders', icon: Package },
      { label: 'Logistics & Fleet', href: '/admin/delivery', icon: Truck },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Market Prices', href: '/admin/prices', icon: TrendingUp },
      { label: 'Analytics & GMV', href: '/admin/analytics', icon: BarChart3 },
      { label: 'AI Suite Insights', href: '/admin/ai-insights', icon: Sparkles, badge: 'AI' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { label: 'System Alerts', href: '/admin/alerts', icon: AlertCircle },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { session, logout } = useAdminAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/50 shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <img src="/favicon.svg" alt="KrishiSetu Logo" className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Krishi<span className="text-emerald-400">Setu</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              National Control Center
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-slate-400 group-hover:text-emerald-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Public App Quick Switcher */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Public Platform
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Visit Public Marketplace
            </span>
          </Link>
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              AD
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs font-semibold text-white truncate">
                {session?.name || 'Platform Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {session?.phone ? `+91 ${session.phone}` : 'DoCA Authorized'}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            title="Sign out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
