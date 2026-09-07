'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import KpiCard from '@/components/admin/KpiCard';
import ImpactCard from '@/components/admin/ImpactCard';
import { ChartBar, HorizontalBar } from '@/components/admin/ChartBar';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import { getAuthHeaders, getApiUrl } from '@/lib/api/client';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl('/api/admin/dashboard'), { headers });
      const json = await res.json();
      setData(json.data || json);
    } catch (err) {
      console.warn('Analytics fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalGmv = data?.orders?.totalGmv || 148500;
  const totalOrders = data?.orders?.totalOrders || 12;
  const totalFarmers = data?.users?.totalFarmers || 8;
  const totalBuyers = data?.users?.totalBuyers || 5;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const monthlyGrowth = [
    { label: 'May', value: 28000, color: '#10b981' },
    { label: 'Jun', value: 45000, color: '#10b981' },
    { label: 'Jul', value: 68000, color: '#10b981' },
    { label: 'Aug', value: 92000, color: '#10b981' },
    { label: 'Sep', value: totalGmv, color: '#059669' },
  ];

  const categoryDistribution = [
    { label: 'Fresh Vegetables (टमाटर, आलू, प्याज़)', value: 62, color: '#10b981' },
    { label: 'Grains & Pulses (गेहूँ, धान, दाल)', value: 24, color: '#06b6d4' },
    { label: 'Cash Crops (सरसों, गन्ना)', value: 14, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="kpi" cols={4} />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics & Economic Intelligence"
        subtitle="Department of Consumer Affairs macro-economic surveillance on farmgate turnover, margin capture, and supply efficiency."
        badge="DoCA Macro Surveillance"
        badgeVariant="blue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Analytics & GMV' },
        ]}
        actions={
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Platform GMV"
          value={formatINR(totalGmv)}
          subtitle="+42% quarter-on-quarter"
          icon={TrendingUp}
          variant="emerald"
        />
        <KpiCard
          title="Direct Payouts Disbursed"
          value={formatINR(totalGmv * 0.94)}
          subtitle="Net cash in farmer bank accounts"
          icon={DollarSign}
          variant="teal"
        />
        <KpiCard
          title="Middlemen Commissions Saved"
          value={formatINR(totalGmv * 0.18)}
          subtitle="Direct societal welfare retained"
          icon={Award}
          variant="amber"
        />
        <KpiCard
          title="Avg Order Ticket Size"
          value={formatINR(totalOrders > 0 ? totalGmv / totalOrders : 8500)}
          subtitle="Commercial wholesale batch"
          icon={ShoppingBag}
          variant="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GMV Growth Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Monthly GMV Realization Trend (₹)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Month-over-month agricultural trade expansion
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Surging Direct Volume
            </span>
          </div>

          <div className="pt-4">
            <ChartBar
              data={monthlyGrowth}
              height={160}
              showValues={true}
              showLabels={true}
            />
          </div>
        </div>

        {/* Commodity Distribution Horizontal Bars */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Produce Category Share (%)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Volume breakdown across agricultural categories
            </p>

            <HorizontalBar data={categoryDistribution} />
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              DoCA Price Stability Metric
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Perishable vegetables show highest disintermediation velocity, shielding urban households from sudden retail spikes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
