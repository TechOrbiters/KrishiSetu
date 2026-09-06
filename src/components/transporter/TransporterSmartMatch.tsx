'use client';

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { SmartMatchJob } from '@/types/transporter';

interface Props {
  jobs: SmartMatchJob[];
  loading: boolean;
  onRefresh: () => void;
  onAcceptJob: (job: SmartMatchJob) => void;
  onDeclineJob: (job: SmartMatchJob) => void;
  acceptingId: string | null;
  driverCapacityKg: number;
}

export default function TransporterSmartMatch({
  jobs,
  loading,
  onRefresh,
  onAcceptJob,
  onDeclineJob,
  acceptingId,
  driverCapacityKg,
}: Props) {
  const [filter, setFilter] = useState<'best_match' | 'nearest' | 'highest_fare' | 'urgent'>('best_match');

  const filteredJobs = [...jobs].sort((a, b) => {
    if (filter === 'nearest') return a.distance_km - b.distance_km;
    if (filter === 'highest_fare') return b.fare_amount - a.fare_amount;
    if (filter === 'urgent') return a.deadline_hours - b.deadline_hours;
    return b.match_score - a.match_score;
  });

  return (
    <div className="space-y-5">
      {/* 1. HEADER & FILTER CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">उपलब्ध डिलीवरी कार्य (Smart Transport Match)</h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {jobs.length} कार्य
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            AI स्मार्ट एल्गोरिदम द्वारा वाहन क्षमता ({driverCapacityKg} kg), नजदीकी दूरी और सर्वोत्तम भाड़े पर आधारित
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-2xs"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setFilter('best_match')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
            filter === 'best_match'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>★ बेस्ट मैच (Best Match)</span>
        </button>

        <button
          onClick={() => setFilter('nearest')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
            filter === 'nearest'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>नजदीकी (Nearest First)</span>
        </button>

        <button
          onClick={() => setFilter('highest_fare')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
            filter === 'highest_fare'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>₹ उच्चतम भाड़ा (Highest Fare)</span>
        </button>

        <button
          onClick={() => setFilter('urgent')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
            filter === 'urgent'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>अति आवश्यक (Urgent Delivery)</span>
        </button>
      </div>

      {/* 2. JOB CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Truck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">वर्तमान में कोई नई डिलीवरी उपलब्ध नहीं है</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            जैसे ही किसी किसान या खरीदार द्वारा नया डिलीवरी ऑर्डर बनेगा, AI स्मार्टमैच द्वारा तुरंत यहाँ प्रदर्शित होगा।
          </p>
          <button
            onClick={onRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            दोबारा जांचें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isOverCapacity = job.weight_kg > driverCapacityKg;

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Top Badge & Fare */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          job.match_score >= 85
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-orange-50 text-orange-800 border-orange-200'
                        }`}
                      >
                        ★ {job.match_score}% स्मार्ट मैच
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">{job.distance_km} किमी रूट</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">100% ड्राइवर भाड़ा</span>
                      <strong className="text-xl font-black text-orange-700">₹{job.fare_amount}</strong>
                    </div>
                  </div>

                  {/* Cargo Info */}
                  <div className="pt-3 pb-2 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                        {job.crop_name}
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        श्रेणी: {job.category} • ऑर्डर #{job.order_number}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        भार: {job.weight_kg} किग्रा
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isOverCapacity ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {isOverCapacity
                          ? `क्षमता से अधिक (वाहन: ${driverCapacityKg}kg)`
                          : `क्षमता अनुकूल (${Math.round((job.weight_kg / driverCapacityKg) * 100)}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Route Details Box */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold text-sm">🟢</span>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">
                          पिक-अप (किसान खेत / मंडी):
                        </span>
                        <strong className="text-slate-800 font-semibold">{job.pickup_address}</strong>
                        {job.farmer_name && (
                          <span className="text-slate-500 block text-[10px] mt-0.5">किसान: {job.farmer_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold text-sm">🔴</span>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">
                          डिलीवरी गंतव्य (खरीदार):
                        </span>
                        <strong className="text-slate-800 font-semibold">{job.delivery_address}</strong>
                        {job.buyer_name && (
                          <span className="text-slate-500 block text-[10px] mt-0.5">खरीदार: {job.buyer_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons Tags */}
                  {job.match_reasons && job.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2.5">
                      {job.match_reasons.map((r, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-600 text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* FreshRoute Status Indicator */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>FreshRoute: सुरक्षित डिलीवरी विंडो ({job.estimated_duration_mins} मिनट)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">डिलीवरी सीमा: {job.deadline_hours} घंटे</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onDeclineJob(job)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors text-center"
                  >
                    छोड़ें (Decline)
                  </button>

                  <button
                    onClick={() => onAcceptJob(job)}
                    disabled={acceptingId === job.id || isOverCapacity}
                    className="w-2/3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {acceptingId === job.id
                        ? 'स्वीकार हो रहा है...'
                        : isOverCapacity
                        ? 'क्षमता अपर्याप्त'
                        : 'स्वीकार करें (Accept Job)'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
