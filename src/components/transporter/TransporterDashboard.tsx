'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Star,
  Package,
  PhoneCall,
  Navigation,
} from 'lucide-react';
import { SmartMatchJob, TransporterTrip, TransporterEarningsSummary } from '@/types/transporter';

interface Props {
  isOnline: boolean;
  onToggleOnline: () => void;
  jobs: SmartMatchJob[];
  activeTrips: TransporterTrip[];
  earnings: TransporterEarningsSummary | null;
  onNavigateTab: (tab: 'available' | 'trips' | 'vehicles' | 'earnings' | 'ratings' | 'tracking') => void;
  onAcceptJob: (job: SmartMatchJob) => void;
  acceptingId: string | null;
}

export default function TransporterDashboard({
  isOnline,
  onToggleOnline,
  jobs,
  activeTrips,
  earnings,
  onNavigateTab,
  onAcceptJob,
  acceptingId,
}: Props) {
  const activeTrip = activeTrips.find(
    (t) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(t.status)
  );
  const topJob = jobs.length > 0 ? jobs[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. STATUS & DUTY BANNER */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
          isOnline
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border-emerald-200'
            : 'bg-slate-100 border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-xs ${
              isOnline ? 'bg-emerald-600' : 'bg-slate-500'
            }`}
          >
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isOnline ? 'ड्यूटी ऑन — डिलीवरी के लिए तैयार' : 'ड्यूटी ऑफ — ऑफलाइन'}
              </h2>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                }`}
              />
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              {isOnline
                ? `आपके रूट और वाहन अनुकूल ${jobs.length} नई डिलीवरी उपलब्ध हैं।`
                : 'नई डिलीवरी स्वीकार करने के लिए ड्यूटी चालू करें।'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleOnline}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 ${
            isOnline
              ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <span>{isOnline ? 'ड्यूटी ऑफ करें' : 'ड्यूटी ऑन करें (Go Online)'}</span>
        </button>
      </div>

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Available Jobs */}
        <div
          onClick={() => onNavigateTab('available')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">उपलब्ध डिलीवरी</span>
            <Truck className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{jobs.length}</span>
            <span className="text-[11px] font-bold text-orange-600">SmartMatch</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-1">
            फसली रूट के अनुकूल
          </span>
        </div>

        {/* Active Trips */}
        <div
          onClick={() => onNavigateTab('trips')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">सक्रिय ट्रिप्स</span>
            <Navigation className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-700">
              {activeTrips.filter((t) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(t.status)).length}
            </span>
            <span className="text-[11px] font-bold text-blue-600">प्रगति पर</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-1">
            लाइव GPS ट्रैकिंग जारी
          </span>
        </div>

        {/* Today's Earnings */}
        <div
          onClick={() => onNavigateTab('earnings')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">आज की कमाई</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{earnings?.today_earnings || 1990}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
              100% Payout
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-1">
            ₹0 प्लेटफॉर्म कमीशन (Rule R-001)
          </span>
        </div>

        {/* Transporter Rating */}
        <div
          onClick={() => onNavigateTab('ratings')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">ड्राइवर रेटिंग</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">4.9</span>
            <span className="text-[11px] font-bold text-emerald-600">★ शीर्ष 5%</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block mt-1">
            98.8% ऑन-टाइम डिलीवरी
          </span>
        </div>
      </div>

      {/* 3. CURRENT ACTIVE TRIP SPOTLIGHT (IF ANY) */}
      {activeTrip && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                सक्रिय ट्रिप प्रगति पर है (#{activeTrip.id.slice(-6).toUpperCase()})
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                {activeTrip.status === 'ACCEPTED'
                  ? 'स्वीकृत (Accepted)'
                  : activeTrip.status === 'ARRIVED_AT_PICKUP'
                  ? 'पिक-अप स्थान पर'
                  : activeTrip.status === 'PICKED_UP'
                  ? 'लोड उठाया गया'
                  : activeTrip.status === 'IN_TRANSIT'
                  ? 'रास्ते में (In Transit)'
                  : activeTrip.status}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-bold">कुल भाड़ा (100% ड्राइवर को)</span>
              <span className="text-xl font-black text-orange-700">₹{activeTrip.fare_amount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-sm">🟢</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">पिक-अप (किसान खेत / मंडी):</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">{activeTrip.pickup_address}</strong>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    किसान: {activeTrip.farmer_name} ({activeTrip.farmer_phone})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-red-600 font-bold text-sm">🔴</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">डिलीवरी गंतव्य (खरीदार):</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">{activeTrip.delivery_address}</strong>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    खरीदार: {activeTrip.buyer_name} ({activeTrip.buyer_phone})
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">फसल व भार:</span>
                  <strong className="text-slate-900 font-extrabold">{activeTrip.crop_name} ({activeTrip.weight_kg} kg)</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">अनुमानित दूरी:</span>
                  <span className="text-slate-900 font-semibold">{activeTrip.distance_km} किमी</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('tracking')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>लाइव मैप देखें (Track)</span>
                </button>
                <button
                  onClick={() => onNavigateTab('trips')}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors"
                >
                  स्टेटस अपडेट करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BEST MATCH OPPORTUNITY CALLOUT */}
      {topJob && !activeTrip && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md">
                ★ {topJob.match_score}% स्मार्ट मैच
              </span>
              <span className="text-xs text-slate-500 font-semibold">नजदीकी सबसे अनुकूल कार्य</span>
            </div>
            <span className="text-lg font-black text-orange-700">₹{topJob.fare_amount}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="text-slate-900 text-sm block">{topJob.crop_name} ({topJob.weight_kg} किग्रा)</strong>
              <span className="text-slate-500 font-medium">
                {topJob.pickup_address} → {topJob.delivery_address} ({topJob.distance_km} किमी)
              </span>
            </div>

            <button
              onClick={() => onAcceptJob(topJob)}
              disabled={acceptingId === topJob.id}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{acceptingId === topJob.id ? 'स्वीकार हो रहा है...' : 'तुरंत स्वीकार करें (Accept)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. QUICK ACTIONS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('available')}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
            🌾
          </div>
          <strong className="text-xs font-bold text-slate-900 block">उपलब्ध ऑर्डर</strong>
          <span className="text-[10px] text-slate-400 block font-medium">SmartMatch द्वारा देखें</span>
        </button>

        <button
          onClick={() => onNavigateTab('vehicles')}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
            🚛
          </div>
          <strong className="text-xs font-bold text-slate-900 block">वाहन प्रबंधन</strong>
          <span className="text-[10px] text-slate-400 block font-medium">क्षमता और सत्यापन</span>
        </button>

        <button
          onClick={() => onNavigateTab('earnings')}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
            💰
          </div>
          <strong className="text-xs font-bold text-slate-900 block">कमाई बहीखाता</strong>
          <span className="text-[10px] text-slate-400 block font-medium">100% ड्राइवर भुगतान</span>
        </button>

        <button
          onClick={() => onNavigateTab('ratings')}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
            ⭐
          </div>
          <strong className="text-xs font-bold text-slate-900 block">समीक्षा व रेटिंग</strong>
          <span className="text-[10px] text-slate-400 block font-medium">किसान/खरीदार फीडबैक</span>
        </button>
      </div>
    </div>
  );
}
