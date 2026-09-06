'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import {
  computeDemandSense,
  computeSmartMatch,
  computeSellSmartOptions,
  computeMarketPilotAdvice,
} from '@/lib/domain/aiEngine';
import { formatINR } from '@/lib/domain/pricing';
import { fetchDemandSense, fetchSellSmart, fetchMarketPilot } from '@/lib/api/client';

export default function AIRecommendationsPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [quantityKg, setQuantityKg] = useState<number>(500);
  const [askingPrice, setAskingPrice] = useState<number>(24);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [demandSense, setDemandSense] = useState<any>(() => computeDemandSense('Tomato', 'Lucknow'));
  const [sellSmartData, setSellSmartData] = useState<any>(() => ({
    sellingOptions: computeSellSmartOptions('Tomato', 500, 24),
  }));
  const [marketPilot, setMarketPilot] = useState<any>(() => computeMarketPilotAdvice('Tomato', 24));
  const matches = computeSmartMatch(askingPrice, quantityKg, selectedCrop);

  useEffect(() => {
    let isMounted = true;
    async function loadRealAiRecommendations() {
      setIsLoading(true);
      try {
        const [dsRes, ssRes, mpRes] = await Promise.all([
          fetchDemandSense(selectedCrop, 'Barabanki'),
          fetchSellSmart(selectedCrop, quantityKg, askingPrice, 'Barabanki'),
          fetchMarketPilot(selectedCrop, 24, quantityKg, 'Barabanki'),
        ]);

        if (isMounted) {
          if (dsRes.success && dsRes.data?.forecast) {
            setDemandSense({
              ...dsRes.data.forecast,
              confidencePct: dsRes.data.confidence,
              fallbackUsed: dsRes.data.fallbackUsed,
            });
          }
          if (ssRes.success && ssRes.data?.sellingOptions) {
            setSellSmartData(ssRes.data);
          }
          if (mpRes.success && mpRes.data?.action) {
            setMarketPilot(mpRes.data);
          }
        }
      } catch (err) {
        console.warn('AI fetch fallback triggered:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealAiRecommendations();
    return () => { isMounted = false; };
  }, [selectedCrop, quantityKg, askingPrice]);

  const sellSmartOptions = sellSmartData.sellingOptions || computeSellSmartOptions(selectedCrop, quantityKg, askingPrice);

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <Sparkles className="w-4 h-4 text-amber-300" />
              AgriSmart AI सिफारिश प्रणाली
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 leading-tight">
              आपकी उपज के लिए AI सुझाव (AI Selling Recommendation)
            </h1>
            <p className="text-xs text-purple-200 mt-1">
              DemandSense + SellSmart + SmartMatch + MarketPilot
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider block">
              SELLING OPPORTUNITY
            </span>
            <span className="text-3xl font-extrabold text-amber-300">
              {marketPilot.opportunityScore}/100
            </span>
          </div>
        </div>

        {/* Input Parameters Switcher */}
        <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700">फसल चुनें:</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-slate-100 p-2 rounded-xl font-bold text-slate-900 focus:outline-none border border-slate-200"
            >
              <option value="Tomato">टमाटर (Tomato)</option>
              <option value="Potato">आलू (Potato)</option>
              <option value="Wheat">गेहूँ (Wheat)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700">मात्रा:</label>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(Number(e.target.value))}
              className="w-24 bg-slate-100 p-2 rounded-xl font-bold text-slate-900 focus:outline-none border border-slate-200 text-center"
            />
            <span>kg</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700">आपका मूल्य:</label>
            <input
              type="number"
              value={askingPrice}
              onChange={(e) => setAskingPrice(Number(e.target.value))}
              className="w-20 bg-slate-100 p-2 rounded-xl font-bold text-brand-green focus:outline-none border border-slate-200 text-center"
            />
            <span>/kg</span>
          </div>
        </div>

        {/* SECTION 1: DEMANDSENSE (मांग पूर्वानुमान) */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-brand-purple flex items-center justify-center font-bold">
                📈
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">DemandSense — मांग पूर्वानुमान</h2>
                <p className="text-xs text-slate-500">स्थान: {demandSense.location} · फसल: {demandSense.crop}</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
              विश्वास स्तर: {demandSense.confidencePct}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block">अनुमानित मांग</span>
              <span className="text-base font-extrabold text-slate-900">{demandSense.expectedDemandTonnes} टन</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-400 block">वर्तमान आपूर्ति</span>
              <span className="text-base font-extrabold text-slate-900">{demandSense.nearbySupplyTonnes} टन</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block font-semibold">मांग अंतर (Gap)</span>
              <span className="text-base font-extrabold text-emerald-800">+{demandSense.supplyGapKg} kg</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
              <span className="text-[11px] text-purple-700 block font-semibold">ट्रेंड</span>
              <span className="text-base font-extrabold text-brand-purple">↑ {demandSense.trendPct}%</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl text-xs text-purple-900 border border-purple-100">
            🤖 <strong>AI स्पष्टीकरण:</strong> "{demandSense.explanation}"
          </div>
        </div>

        {/* SECTION 2: SELLSMART (राजस्व कैलकुलेटर) */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">SellSmart — किसान राजस्व तुलना</h2>
              <p className="text-xs text-slate-500">बिना परिवहन कटौती के शुद्ध किसान आय तुलना</p>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Zero Transport Deduction Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sellSmartOptions.map((opt: any) => (
              <div
                key={opt.id}
                className={`p-4 rounded-xl border transition-all relative ${
                  opt.isRecommended
                    ? 'border-2 border-brand-green bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {opt.isRecommended && (
                  <span className="absolute -top-3 right-3 bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    BEST RECOMMENDATION
                  </span>
                )}
                <h4 className="font-bold text-sm text-slate-900">{opt.buyerName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">दर: ₹{opt.offeredPricePerKg}/kg · {opt.distanceKm} km दूर</p>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 block">अनुमानित किसान आय (Farmer Revenue)</span>
                  <span className="text-xl font-extrabold text-brand-green">
                    {formatINR(opt.farmerRevenue || opt.estimatedRevenue?.farmerRevenue || 0)}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                  {(opt.whyThisOption || []).map((reason: string, i: number) => (
                    <div key={i} className="flex items-center gap-1 text-slate-700">
                      <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: SMARTMATCH (खरीदार रैंकिंग) */}
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">SmartMatch — शीर्ष खरीदार मैच</h2>
              <p className="text-xs text-slate-500">30% मूल्य · 25% दूरी · 20% मात्रा · 10% गुणवत्ता · 10% समय · 5% साख</p>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((m) => (
              <div
                key={m.buyerId}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-green transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{m.buyerName}</h3>
                    <span className="bg-purple-100 text-purple-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                      {m.matchScore}/100 Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    मूल्य: <strong className="text-brand-green font-bold">₹{m.offeredPricePerKg}/kg</strong> · आवश्यकता: {m.quantityNeededKg} kg · दूरी: {m.distanceKm} km · रेटिंग: ★{m.reliabilityRating}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap pt-1">
                    {m.reasons.map((r, i) => (
                      <span key={i} className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/farmer/orders"
                  className="bg-brand-green text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-deep transition-all text-center flex-shrink-0"
                >
                  ऑफ़र देखें
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: MARKETPILOT (कार्यवाही योग्य सलाह) */}
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">
                🎯
              </div>
              <h2 className="font-bold text-lg">MarketPilot — आज क्या करें?</h2>
            </div>
            <span className="bg-emerald-400/20 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300/30">
              एक्शन योग्य सिफारिश
            </span>
          </div>

          <p className="text-sm text-emerald-100 leading-relaxed font-medium">
            "{marketPilot.reason}"
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => alert('70% उपज तुरंत बेचने की प्रक्रिया शुरू की गई')}
              className="w-full sm:w-auto bg-brand-green text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              अभी बेचें ({marketPilot.sellPercentage}%)
            </button>
            <button
              onClick={() => alert('30% उपज कल के लिए होल्ड पर रखी गई')}
              className="w-full sm:w-auto bg-white/10 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              बाद में बेचें ({marketPilot.holdPercentage}%)
            </button>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
