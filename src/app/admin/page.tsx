'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const activeRole = localStorage.getItem('krishi_active_role');
      const session = localStorage.getItem('krishi_admin_session');

      if (activeRole === 'ADMIN' || session) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/login');
      }
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-emerald-950 animate-pulse">
        <Shield className="w-7 h-7" />
      </div>
      <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        Connecting to KrishiSetu Admin Control Center...
      </div>
    </div>
  );
}
