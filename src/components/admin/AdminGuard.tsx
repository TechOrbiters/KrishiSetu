'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { logoutFirebase } from '@/lib/firebase/authClient';
import { signOutSupabase } from '@/lib/supabase/authClient';

interface AdminSession {
  uid: string;
  phone?: string;
  email?: string;
  name?: string;
  loginTime: number;
}

interface AdminAuthContextType {
  session: AdminSession | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  session: null,
  logout: async () => {},
  isLoading: true,
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local session
    try {
      const activeRole = localStorage.getItem('krishi_active_role');
      const rawSession = localStorage.getItem('krishi_admin_session');

      if (activeRole !== 'ADMIN' && !rawSession) {
        // Not logged in as admin - redirect to login
        router.replace('/admin/login');
        return;
      }

      let parsed: AdminSession = {
        uid: 'admin_master',
        phone: '9999999999',
        name: 'National Admin',
        loginTime: Date.now(),
      };

      if (rawSession) {
        try {
          parsed = { ...parsed, ...JSON.parse(rawSession) };
        } catch {
          // Keep default parsed
        }
      }

      // Ensure active role is set in local storage for API client header injection
      localStorage.setItem('krishi_active_role', 'ADMIN');
      setSession(parsed);
      setIsLoading(false);
    } catch {
      router.replace('/admin/login');
    }
  }, [router, pathname]);

  const logout = async () => {
    try {
      localStorage.removeItem('krishi_admin_session');
      localStorage.removeItem('krishi_active_role');
      await logoutFirebase().catch(() => {});
      await signOutSupabase().catch(() => {});
    } finally {
      router.push('/admin/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-700/20 mb-4 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          Verifying KrishiSetu Admin Credentials...
        </div>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ session, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
