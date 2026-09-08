'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Sparkles,
  Award,
  ChevronLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { signInWithSupabase } from '@/lib/supabase/authClient';

export default function AdminLoginPage() {
  const router = useRouter();

  // Mode: 'EMAIL' | 'PHONE'
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');

  // Fields
  const [email, setEmail] = useState('admin@krishisetu.in');
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (identifier: string, pass: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Supabase Auth Integration
      const res = await signInWithSupabase(identifier, pass, 'ADMIN');

      if (!res.success) {
        setError(res.error || 'लॉगिन असफल रहा (Admin login failed)');
        return;
      }

      // 2. Set audited admin session in local storage
      localStorage.setItem('krishi_active_role', 'ADMIN');
      localStorage.setItem(
        'krishi_admin_session',
        JSON.stringify({
          uid: res.user?.id || `admin_${identifier}`,
          email: res.user?.email || identifier,
          phone: authMethod === 'PHONE' ? identifier : '9999999999',
          name: 'National Platform Administrator',
          designation: 'DoCA Surveillance Officer',
          role: 'ADMIN',
          loginTime: Date.now(),
        })
      );

      // Navigate to dashboard
      router.push('/admin/dashboard');
    } catch (e: any) {
      setError(e.message || 'लॉगिन असफल रहा (Admin login failed)');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'EMAIL') {
      if (!email.trim()) {
        setError('कृपया आधिकारिक ईमेल पता दर्ज करें (Please enter official email address)');
        return;
      }
    } else {
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit authorized phone number');
        return;
      }
    }
    if (!password) {
      setError('कृपया पासवर्ड दर्ज करें (Please enter password)');
      return;
    }

    handleLogin(authMethod === 'EMAIL' ? email : phone, password);
  };

  const handleDemoLogin = () => {
    setEmail('admin@krishisetu.in');
    setPassword('admin123');
    handleLogin('admin@krishisetu.in', 'admin123');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Left Panel: DoCA Mission & Branding */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-r border-emerald-900/30 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group text-slate-300 hover:text-white transition-colors mb-6 text-xs font-medium">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Public Marketplace
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-xl shadow-emerald-950">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  Krishi<span className="text-emerald-400">Setu</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  National
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Department of Consumer Affairs (DoCA) • Supabase Auth
              </p>
            </div>
          </div>
        </div>

        {/* Center: Mission Card */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Award className="w-4 h-4" />
            Problem Statement ID: 26033
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-3">
            Direct Farm-to-Consumer Governance
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Eliminating multi-tier intermediaries to maximize farmgate realization and lower retail vegetable basket costs through real-time logistics and transparent market surveillance.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Commission Escrow:</strong> Automated transparent payouts directly into farmer accounts upon quality verification.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>FreshRoute Telemetry:</strong> Multi-sensor spoilage reduction tracking agricultural consignments end-to-end.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>KrishiSetu Surveillance:</strong> Anomaly detection against price gouging and APMC hoarding.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom meta */}
        <div className="relative z-10 text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          Ministry of Consumer Affairs, Food & Public Distribution • Govt of India
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Header */}
          <div>
            <div className="lg:hidden flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-white">
                  Krishi<span className="text-emerald-400">Setu</span> Admin
                </span>
              </div>
              <Link href="/" className="text-xs text-slate-400 hover:text-white">
                Back to Site
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-3 border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Restricted Administrative Access • Supabase Secured
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Control Center Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Authorized personnel only. Sessions are logged and audited under DoCA security protocols.
            </p>
          </div>

          {/* Quick Demo Button for Evaluators */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-emerald-950/40 border border-emerald-700/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Evaluator Quick Access
              </span>
              <span className="text-[10px] text-emerald-200/70 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30">
                1-Click Demo
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Sign in immediately as National Platform Administrator (DoCA Officer).
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Enter Admin Control Center (DoCA ID)
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Method Toggle: Email / Password vs Phone */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('EMAIL');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMethod === 'EMAIL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Official Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PHONE');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMethod === 'PHONE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Authorized Mobile PIN
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {authMethod === 'EMAIL' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Email Address (@doca.gov.in / @krishisetu.in)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@doca.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Authorized Admin Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9999999999"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Security Passcode / Master Password
                </label>
                <span className="text-[11px] text-slate-500">Supabase Encrypted</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-950"
                />
                <span className="text-xs text-slate-400">Remember this audited workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Authenticate with Supabase
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unauthorized access attempts are monitored and reported under IT Act Section 43/66.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
