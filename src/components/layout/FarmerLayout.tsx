'use client';

import React, { useState } from 'react';
import { FarmerSidebar } from './FarmerSidebar';
import { FarmerTopbar } from './FarmerTopbar';
import { MobileTabBar } from './MobileTabBar';

interface FarmerLayoutProps {
  children: React.ReactNode;
}

export const FarmerLayout: React.FC<FarmerLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex text-slate-800 antialiased font-sans">
      {/* Fixed Left Sidebar (Desktop) + Off-canvas Side Panel Drawer (Mobile/Tablet) */}
      <FarmerSidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <FarmerTopbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <MobileTabBar />
    </div>
  );
};
