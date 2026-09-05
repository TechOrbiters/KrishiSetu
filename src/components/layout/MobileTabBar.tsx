'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sprout, Mic, ShoppingBag, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const MobileTabBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: '/farmer/dashboard', label: 'डैशबोर्ड', icon: LayoutDashboard },
    { href: '/farmer/listings', label: 'मेरी उपज', icon: Sprout },
    { href: '/farmer/listings/new', label: 'बोलकर लिस्ट', icon: Mic, isFAB: true },
    { href: '/farmer/orders', label: 'ऑर्डर', icon: ShoppingBag },
    { href: '/farmer/profile', label: 'प्रोफाइल', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        if (tab.isFAB) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center -mt-6"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform border-4 border-white">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                {tab.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[10px] leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
