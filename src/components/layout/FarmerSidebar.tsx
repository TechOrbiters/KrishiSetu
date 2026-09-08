'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sprout,
  ShoppingBag,
  Truck,
  CreditCard,
  BarChart2,
  User,
  Globe,
  LogOut,
  ChevronDown,
  Bot,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { LanguageSelector } from '../common/LanguageSelector';

interface FarmerSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const FarmerSidebar: React.FC<FarmerSidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage, languages } = useLanguage();
  const { user, notificationsCount } = useFarmerStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Clear any stored session data
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ks_auth_token');
        sessionStorage.clear();
      }
    } catch (_) {}
    // Small delay for UX feedback, then redirect to landing
    setTimeout(() => router.push('/'), 400);
  };

  const showFarmerAvatar =
    pathname.includes('/market-prices') ||
    pathname.includes('/orders') ||
    pathname.includes('/delivery') ||
    pathname.includes('/payments') ||
    pathname.includes('/listings') ||
    pathname.includes('/ai-assistant');

  const mainNavItems = [
    { href: '/farmer/dashboard',    labelKey: 'nav.dashboard',    subKey: 'Dashboard',        icon: LayoutDashboard },
    { href: '/farmer/listings',     labelKey: 'nav.listings',     subKey: 'My Listings',      icon: Sprout },
    { href: '/farmer/orders',       labelKey: 'nav.orders',       subKey: 'Orders',           icon: ShoppingBag },
    { href: '/farmer/delivery',     labelKey: 'nav.delivery',     subKey: 'Delivery Status',  icon: Truck },
    { href: '/farmer/payments',     labelKey: 'nav.payments',     subKey: 'Payments',         icon: CreditCard },
    { href: '/farmer/market-prices',labelKey: 'nav.marketPrices', subKey: 'Market Prices',    icon: BarChart2 },
    { href: '/farmer/ai-assistant', labelKey: 'nav.aiAssistant',  subKey: 'AI Assistant',     icon: Bot },
    { href: '/farmer/profile',      labelKey: 'nav.profile',      subKey: 'My Profile',       icon: User },
  ];

  const sidebarContent = (isMobileView = false) => (
    <>
      {/* Sidebar Header: Brand Logo or Farmer Profile Avatar */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        {showFarmerAvatar ? (
          /* Farmer Avatar Variant (on market-prices, orders, delivery, payments, listings) */
          <div className="flex items-center gap-3 w-full">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150"
              alt={user.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base text-slate-900 leading-tight truncate">{user.fullName}</h2>
              <button className="text-xs text-slate-500 flex items-center gap-0.5 hover:text-brand-green truncate">
                <span className="truncate">{user.village}, {user.district}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        ) : (
          /* Brand Logo Variant (on dashboard and profile pages) */
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="KrishiSetu Logo"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div>
              <h1 className="font-extrabold text-xl text-emerald-800 leading-tight tracking-tight">
                KrishiSetu
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">किसान पोर्टल • Farmer Portal</p>
            </div>
          </div>
        )}

        {isMobileView && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/farmer/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobileView) onCloseMobile?.();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              <div className="flex flex-col leading-tight">
                <span className="text-sm">{t(item.labelKey)}</span>
                <span className="text-[11px] text-slate-400 font-normal">{item.subKey}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer: Language Selector & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
        {/* Language Selector Box */}
        <div className="w-full">
          <LanguageSelector className="w-full [&>button]:w-full [&>button]:justify-between" variant="light" showLabel={true} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Logout from KRISHISETU"
          className="w-full text-left px-3 py-2 text-xs text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-60"
        >
          <LogOut className={`w-4 h-4 text-red-500 ${isLoggingOut ? 'animate-spin' : ''}`} />
          <div className="flex flex-col leading-none">
            <span>{isLoggingOut ? 'लॉग आउट हो रहे हैं...' : 'लॉगआउट'}</span>
            <span className="text-[10px] text-red-400 font-normal">Logout</span>
          </div>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none hidden lg:flex">
        {sidebarContent(false)}
      </aside>

      {/* Mobile & Tablet Slide-Out Side Panel Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-slideInLeft select-none">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

