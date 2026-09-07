'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Check,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';

interface AlertItem {
  id: string;
  title: string;
  category: 'Surveillance' | 'FreshRoute' | 'Escrow' | 'KYC';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  description: string;
  resolved: boolean;
}

const initialAlerts: AlertItem[] = [
  {
    id: 'ALT-101',
    title: 'Sitapur Mandi Tomato Rate Anomaly Detected',
    category: 'Surveillance',
    severity: 'MEDIUM',
    timestamp: '15 mins ago',
    description: 'MarketPilot detected a 28% sudden hike in modal prices at Sitapur APMC. Recommended action: Direct bypass routing enabled for local farmers.',
    resolved: false,
  },
  {
    id: 'ALT-102',
    title: 'Farmer Aadhaar e-KYC Pending Review',
    category: 'KYC',
    severity: 'LOW',
    timestamp: '1 hour ago',
    description: 'Ramesh Kumar (Barabanki) submitted land ownership documents and Aadhaar last-4 for escrow verification.',
    resolved: false,
  },
  {
    id: 'ALT-103',
    title: 'FreshRoute Spoilage Window Advisory',
    category: 'FreshRoute',
    severity: 'LOW',
    timestamp: '3 hours ago',
    description: 'Shipment #SHP-BAR-01 ambient temperature elevated to 24°C. Route recalculated to reduce delivery time by 35 minutes.',
    resolved: true,
  },
  {
    id: 'ALT-104',
    title: 'Escrow Settlement Milestone Disbursed',
    category: 'Escrow',
    severity: 'LOW',
    timestamp: '5 hours ago',
    description: 'Order #ORD-7721 verified delivered at Lucknow Mandi. ₹18,400 direct payout credited to farmer account with zero deductions.',
    resolved: true,
  },
];

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [filter, setFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');

  const toggleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: !a.resolved } : a))
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNRESOLVED') return !a.resolved;
    if (filter === 'RESOLVED') return a.resolved;
    return true;
  });

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Alerts & Market Surveillance"
        subtitle="Real-time security telemetry, APMC price-rigging detection, and quality compliance notices."
        badge="DoCA Vigilance Guard"
        badgeVariant="amber"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'System Alerts' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Active Unresolved Alerts"
          value={unresolvedCount}
          subtitle="Requires administrator review"
          icon={AlertTriangle}
          variant="amber"
        />
        <KpiCard
          title="Price Arbitrage Anomalies"
          value="1 Monitored"
          subtitle="MarketPilot automated surveillance"
          icon={ShieldAlert}
          variant="rose"
        />
        <KpiCard
          title="Resolved Compliance Events"
          value={alerts.length - unresolvedCount}
          subtitle="Audited and closed by DoCA"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Filter Events:
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {(['ALL', 'UNRESOLVED', 'RESOLVED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filter === mode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {mode === 'ALL' ? 'All Notices' : mode === 'UNRESOLVED' ? 'Pending Action' : 'Resolved'}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing {filteredAlerts.length} events
        </span>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.map((alt) => (
          <div
            key={alt.id}
            className={`p-5 rounded-2xl border transition-all ${
              alt.resolved
                ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alt.severity === 'HIGH'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                      : alt.severity === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}
                >
                  {alt.severity}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {alt.category}
                </span>

                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {alt.title}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {alt.timestamp}
                </span>

                <button
                  onClick={() => toggleResolve(alt.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    alt.resolved
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {alt.resolved ? 'Mark Pending' : 'Resolve'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
              {alt.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
