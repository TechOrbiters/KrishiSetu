'use client';

import React from 'react';
import { TrendingUp, ShieldCheck, ArrowRight, Award, DollarSign, Clock, Users } from 'lucide-react';

interface ImpactCardProps {
  farmerGainPercent?: number;
  consumerSavingPercent?: number;
  intermediariesReduced?: string;
  foodMilesSavedKm?: number;
  totalGmvFormatted?: string;
  farmerDirectPayoutFormatted?: string;
  className?: string;
}

export default function ImpactCard({
  farmerGainPercent = 22.4,
  consumerSavingPercent = 14.8,
  intermediariesReduced = '3 to 0',
  foodMilesSavedKm = 1240,
  totalGmvFormatted = '₹0',
  farmerDirectPayoutFormatted = '₹0',
  className = '',
}: ImpactCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-6 text-white shadow-xl border border-emerald-800/40 ${className}`}>
      {/* Decorative ambient backdrop */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            PS ID 26033: DoCA Impact Meter
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Disintermediation & Welfare Realization
          </h2>
          <p className="text-xs text-emerald-100/70 mt-1 max-w-xl">
            Department of Consumer Affairs objective: Eliminating middlemen to maximize farmgate realization while ensuring affordable staples for consumers.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-emerald-200/80 uppercase font-medium">Intermediary Layers</div>
            <div className="text-lg font-bold text-white flex items-center justify-end gap-1.5">
              <span className="line-through text-rose-400/80">3–4 tiers</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-extrabold">{intermediariesReduced}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Impact Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        {/* Metric 1 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-200/80">Farmer Realization</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 tracking-tight">
            +{farmerGainPercent}%
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Over typical APMC mandi broker rates
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-teal-200/80">Consumer Price Drop</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-300 tracking-tight">
            -{consumerSavingPercent}%
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Savings on retail fresh staples
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-200/80">Direct Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            {farmerDirectPayoutFormatted}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Zero-commission farmer escrow payout
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sky-200/80">Logistics Efficiency</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-sky-300 tracking-tight">
            {foodMilesSavedKm > 0 ? `${foodMilesSavedKm} km` : '18 hrs'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Saved transit time & fresh route
          </div>
        </div>
      </div>
    </div>
  );
}
