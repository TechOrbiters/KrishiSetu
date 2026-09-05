'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { formatINR } from '@/lib/domain/pricing';

export default function FPOAnalyticsPage() {
  const { user, listings, orders } = useFarmerStore();

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <BarChart3 className="w-4 h-4 text-purple-300" />
              {user.fpoName || 'शर्मा एफपीओ (Sharma FPO)'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 leading-tight">
              एफपीओ प्रदर्शन एनालिटिक्स (FPO Analytics)
            </h1>
            <p className="text-xs text-purple-200 mt-1">
              सदस्य किसानों के लिए प्राप्त अतिरिक्त आय एवं विक्रय प्रगति रिपोर्ट
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] text-purple-200 block uppercase font-bold">औसत मूल्य प्राप्ति</span>
            <span className="text-2xl font-extrabold text-amber-300">₹23.5/kg</span>
            <span className="text-[10px] text-emerald-300 block">मंडी से +14% अधिक</span>
          </div>
        </div>

        {/* 4 Key FPO Performance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">कुल एग्रीगेटेड उपज</span>
            <span className="text-2xl font-extrabold text-slate-900">4.2 टन</span>
            <span className="text-[11px] text-emerald-600 font-bold block">↑ 22% इस माह</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">कुल बेची गई उपज</span>
            <span className="text-2xl font-extrabold text-brand-green">3.6 टन</span>
            <span className="text-[11px] text-slate-400 block">85% रूपांतरण दर</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">सक्रिय bulk खरीदार</span>
            <span className="text-2xl font-extrabold text-purple-900">12 खरीदार</span>
            <span className="text-[11px] text-purple-700 font-semibold block">FreshMart, होटल श्रृंखलाएं</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-2xs space-y-1">
            <span className="text-xs text-slate-400 font-medium block">ताज़गी नुकसान बचाया (Saved)</span>
            <span className="text-2xl font-extrabold text-emerald-600">₹32,400</span>
            <span className="text-[11px] text-emerald-700 font-bold block">FreshRoute तकनीक द्वारा</span>
          </div>
        </div>

        {/* Analytics Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              फसल-वार विक्रय वितरण (Crop-wise Distribution)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>गेहूँ (Wheat)</span>
                  <span>1,800 kg (₹39,600)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green w-[50%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>आलू (Potato)</span>
                  <span>1,200 kg (₹21,600)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[35%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>टमाटर (Tomato)</span>
                  <span>600 kg (₹14,400)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 w-[20%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              सदस्य किसान लाभ प्रभाव (Member Impact)
            </h3>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                🌱 <strong>अतिरिक्त आय:</strong> FPO पूल एग्रीगेशन के माध्यम से सदस्य किसानों को औसत बिचौलिए दरों की तुलना में ₹3.20/kg अधिक प्राप्त हुआ है।
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                🚚 <strong>परिवहन बचत:</strong> स्मार्ट लोड पूलिंग से प्रति ट्रिप ₹400 की बचत हुई है, जो खरीदारों के लिए भी आकर्षक सिद्ध हुई है।
              </div>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
