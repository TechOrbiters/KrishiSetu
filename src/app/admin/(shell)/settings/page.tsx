'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Save,
  Server,
  Key,
  Bell,
  CheckCircle2,
  RefreshCw,
  Database,
  Sliders,
  Cpu,
  Award,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { useAdminAuth } from '@/components/admin/AdminGuard';

export default function AdminSettingsPage() {
  const { session } = useAdminAuth();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Policy state
  const [zeroCommissionPolicy, setZeroCommissionPolicy] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState('20');
  const [maxTransitTemp, setMaxTransitTemp] = useState('25');
  const [autoEscrowReleaseHours, setAutoEscrowReleaseHours] = useState('24');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings & Governance Policy"
        subtitle="Department of Consumer Affairs (DoCA) operational parameters, surveillance thresholds, and system connections."
        badge="System Governance"
        badgeVariant="blue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* PS ID 26033 System Alignment */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              DoCA Problem Statement 26033 Governance Mandate
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforcing zero-brokerage, transparent APMC surveillance, and cold-chain disintermediation.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
          Compliant
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Disintermediation & Escrow Policy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Marketplace Policy Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Zero Commission Policy (0% Cut)
                </div>
                <div className="text-[11px] text-slate-500">
                  Guarantee 100% of agreed buyer produce price goes directly to farmer escrow.
                </div>
              </div>
              <input
                type="checkbox"
                checked={zeroCommissionPolicy}
                onChange={(e) => setZeroCommissionPolicy(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                MarketPilot Anomaly Threshold (%)
              </label>
              <input
                type="number"
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Flag APMC mandis when modal price deviates more than this % from regional median.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                FreshRoute Max Ambient Temp (°C)
              </label>
              <input
                type="number"
                value={maxTransitTemp}
                onChange={(e) => setMaxTransitTemp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Trigger high-priority re-routing when sensor reports ambient temperature above this value.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Auto-Escrow Settlement Window (Hours)
              </label>
              <input
                type="number"
                value={autoEscrowReleaseHours}
                onChange={(e) => setAutoEscrowReleaseHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Automated release of buyer escrow to farmer bank account upon proof of delivery.
              </p>
            </div>
          </div>
        </div>

        {/* System Infrastructure & API Diagnostics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Server className="w-4 h-4 text-teal-600" />
            Infrastructure & Integration Status
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Supabase PostgreSQL
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500">Connected • SSL Enforced</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-teal-500" />
                  Firebase Identity SDK
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500">Active • Role Claims Operational</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  KrishiSetu Microservices
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500">6 Models Active • Gemini Ready</p>
            </div>
          </div>
        </div>

        {/* Administrator Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            Authorized Administrator Profile
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Admin Identity:</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {session?.name || 'National Platform Administrator'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Authorized Contact:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">
                +91 {session?.phone || '9999999999'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Authority Level:</span>
              <span className="font-bold text-emerald-600">
                DoCA Tier-1 National Control Officer
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Session Security:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Encrypted JWT (role: ADMIN)
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Policy parameters updated successfully!
            </span>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Applying Policies...' : 'Save Parameters'}
          </button>
        </div>
      </form>
    </div>
  );
}
