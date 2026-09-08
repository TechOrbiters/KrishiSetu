'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        if (!supabaseClient) {
          router.push('/');
          return;
        }

        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data.session) {
          console.warn('[AuthCallback] Session retrieval notice:', error?.message);
        }

        const pendingRole = searchParams.get('role') || localStorage.getItem('krishi_pending_role') || 'BUYER';
        localStorage.setItem('krishi_active_role', pendingRole);

        if (data.session?.user) {
          const user = data.session.user;
          localStorage.setItem('krishi_user_session', JSON.stringify({
            uid: user.id,
            email: user.email,
            role: pendingRole,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            loginTime: Date.now(),
          }));

          // Sync to public.users table
          try {
            await supabaseClient.from('users').upsert({
              id: user.id,
              firebase_uid: user.id,
              full_name: user.user_metadata?.full_name || 'क्रेता साथी',
              phone: user.user_metadata?.phone || '9999999999',
              role: pendingRole === 'ADMIN' ? 'FPO_ADMIN' : pendingRole,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          } catch (e) {}
        }

        // Navigate to appropriate portal
        if (pendingRole === 'BUYER') router.push('/buyer');
        else if (pendingRole === 'TRANSPORTER') router.push('/transporter');
        else if (pendingRole === 'ADMIN') router.push('/admin/dashboard');
        else router.push('/farmer/dashboard');
      } catch (err) {
        console.error('[AuthCallback] Callback exception:', err);
        router.push('/');
      }
    }

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      <p className="text-sm font-semibold text-slate-300">Supabase प्रमाणीकरण सत्यापित हो रहा है...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">लोड हो रहा है...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

