'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  ChevronRight,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Mic,
  MessageSquare,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { getMarketPriceSummary } from '@/lib/api/client';
import { MarketPriceSummaryCard } from '@/lib/types/market';

export default function FarmerDashboard() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [marketSummaries, setMarketSummaries] = useState<MarketPriceSummaryCard[]>([]);

  useEffect(() => {
    getMarketPriceSummary().then((res) => {
      if (res.success && res.data) {
        setMarketSummaries(res.data);
      }
    });
  }, []);

  return (
    <FarmerLayout>
      <div className="relative space-y-5 max-w-[1000px] mx-auto select-none">
        
        {/* ======================================================== */}
        {/* DEV OVERLAY MODE TOGGLE (Reference Screenshot Alignment)   */}
        {/* ======================================================== */}
        <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className="flex items-center gap-1.5 font-bold hover:text-emerald-400 transition-colors"
          >
            {showOverlay ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
            <span>{showOverlay ? 'Hide Overlay' : 'Compare Reference Overlay'}</span>
          </button>
        </div>

        {/* Development Overlay Image (50% Opacity) */}
        {showOverlay && (
          <div className="absolute inset-0 z-40 pointer-events-none opacity-50 overflow-hidden rounded-2xl border-2 border-red-500">
            <img
              src="/assets/kisan-setu/reference-dashboard.jpg"
              alt="Reference Dashboard"
              className="w-full h-auto object-top"
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. FULL-WIDTH HERO BANNER                                 */}
        {/* ======================================================== */}
        <div className="w-full bg-[#EAF5EF] rounded-2xl border border-emerald-100/80 p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between min-h-[140px] sm:min-h-[152px] relative overflow-hidden shadow-2xs">
          {/* Left Hero Text Content */}
          <div className="z-10 max-w-lg space-y-1.5 sm:space-y-2">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
              अपनी उपज सीधे खरीदारों को बेचें
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold">
              बेहतर दाम पाएं, ज्यादा कमाएं
            </p>
            <div className="pt-1 sm:pt-2">
              <Link
                href="/farmer/listings/new"
                className="inline-flex items-center gap-2 bg-[#15803D] hover:bg-[#14532D] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm group"
              >
                <span>उपज लिस्ट करें</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-black">
                  +
                </div>
              </Link>
            </div>
          </div>

          {/* Right Hero Farmer Illustration (Opacity 30% on mobile for legibility, 100% on desktop) */}
          <div className="absolute top-0 right-0 h-full w-full sm:w-[500px] pointer-events-none overflow-hidden rounded-r-2xl flex justify-end opacity-30 sm:opacity-100 transition-opacity">
            <img
              src="/assets/kisan-setu/hero-farmer-blend.png"
              alt="Farmer in fields holding phone"
              className="h-full w-auto object-cover object-right rounded-r-2xl"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. QUICK ACTIONS ROW (जल्दी करें)                          */}
        {/* ======================================================== */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
            <span>जल्दी करें</span>
            <span className="text-slate-500 font-normal text-xs">(Quick Actions)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
            {/* Card 1: Add New Listing */}
            <Link
              href="/farmer/listings/new"
              className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                🌱
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  नई उपज जोड़ें
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Manual Listing</p>
              </div>
            </Link>

            {/* Card 2: Check Market Prices */}
            <Link
              href="/farmer/market-prices"
              className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                📖
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  मार्केट भाव देखें
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Check Prices</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. MAIN 2-COLUMN DASHBOARD GRID (Left ~608px vs Right ~337px) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          
          {/* ====================================================== */}
          {/* LEFT COLUMN: PRODUCE LISTINGS & RECENT ORDERS (7/12 = ~608px) */}
          {/* ====================================================== */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* ---------------------------------------------------- */}
            {/* A. Produce Listings Card (मेरी लिस्ट की गई उपज)      */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  मेरी लिस्ट की गई उपज
                </h3>
                <Link
                  href="/farmer/listings"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>सभी देखें</span>
                </Link>
              </div>

              {/* Crop Listing Items List */}
              <div className="divide-y divide-slate-100">
                
                {/* Crop Item 1: Wheat */}
                <div className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-1 rounded-xl transition-all">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/assets/kisan-setu/wheat.png"
                      alt="गेहूँ"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          गेहूँ <span className="text-slate-500 font-semibold text-xs">(Wheat)</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        500 kg <span className="mx-1 text-slate-300">•</span> ₹22 / kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200/80">
                      सक्रिय
                    </span>

                    <div className="text-right hidden sm:block">
                      <span className="font-bold text-xs text-slate-900 block">12 ऑर्डर</span>
                      <span className="text-[10px] text-slate-400 font-medium">आज अपडेट किया</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Crop Item 2: Potato */}
                <div className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-1 rounded-xl transition-all">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/assets/kisan-setu/potato.png"
                      alt="आलू"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          आलू <span className="text-slate-500 font-semibold text-xs">(Potato)</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        300 kg <span className="mx-1 text-slate-300">•</span> ₹18 / kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200/80">
                      सक्रिय
                    </span>

                    <div className="text-right hidden sm:block">
                      <span className="font-bold text-xs text-slate-900 block">8 ऑर्डर</span>
                      <span className="text-[10px] text-slate-400 font-medium">आज अपडेट किया</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Crop Item 3: Tomato */}
                <div className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-1 rounded-xl transition-all">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/assets/kisan-setu/tomato.png"
                      alt="टमाटर"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          टमाटर <span className="text-slate-500 font-semibold text-xs">(Tomato)</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        200 kg <span className="mx-1 text-slate-300">•</span> ₹24 / kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="bg-amber-50 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200/80">
                      कम स्टॉक
                    </span>

                    <div className="text-right hidden sm:block">
                      <span className="font-bold text-xs text-slate-900 block">5 ऑर्डर</span>
                      <span className="text-[10px] text-slate-400 font-medium">1 दिन पहले अपडेट किया</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

              </div>

              {/* Dashed Add Button */}
              <Link
                href="/farmer/listings/new"
                className="w-full py-3 border-2 border-dashed border-emerald-600/40 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-50/50 transition-colors"
              >
                <span className="text-base font-black">+</span>
                <span>नई उपज लिस्ट करें</span>
              </Link>
            </div>

            {/* ---------------------------------------------------- */}
            {/* B. Recent Orders Card (हाल के ऑर्डर)                 */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  हाल के ऑर्डर
                </h3>
                <Link
                  href="/farmer/orders"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>सभी देखें</span>
                </Link>
              </div>

              {/* Order 1 */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-700">ऑर्डर #ORD1234</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      पूरा
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">20 मई 2024, 10:30 AM</p>
                  <p className="text-xs font-bold text-slate-900 pt-0.5">
                    गेहूँ <span className="text-slate-400 font-normal">•</span> 200 kg
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">कृषि भंडार ट्रेडर्स, लखनऊ</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-base font-black text-slate-900 block">₹4,400</span>
                  <span className="text-[11px] text-slate-500 font-medium block">डिलीवरी: 22 मई</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 inline-block ml-auto mt-1" />
                </div>
              </div>

              {/* Order 2 */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-700">ऑर्डर #ORD1233</span>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      डिलीवरी पर
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">19 मई 2024, 04:15 PM</p>
                  <p className="text-xs font-bold text-slate-900 pt-0.5">
                    आलू <span className="text-slate-400 font-normal">•</span> 100 kg
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">फूड प्लाजा, कानपुर</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-base font-black text-slate-900 block">₹1,800</span>
                  <span className="text-[11px] text-slate-500 font-medium block">डिलीवरी: 21 मई</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 inline-block ml-auto mt-1" />
                </div>
              </div>

              {/* View All Orders Button */}
              <Link
                href="/farmer/orders"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
              >
                मेरे सभी ऑर्डर देखें
              </Link>
            </div>

          </div>

          {/* ================================================= ===== */}
          {/* RIGHT RAIL: EARNINGS, MARKET PRICES, AI ASSISTANT (5/12 = ~337px) */}
          {/* ================================================= ===== */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* ---------------------------------------------------- */}
            {/* 1. Earnings Card (मेरी कमाई (इस माह))                 */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900">
                  मेरी कमाई <span className="text-slate-500 text-xs font-semibold">(इस माह)</span>
                </h3>
                <span className="text-slate-400 font-bold text-lg cursor-pointer">•••</span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  ₹28,450
                </span>
                <span className="text-xs text-slate-500 font-semibold block">कुल कमाई</span>
              </div>

              {/* Green Highlight Box with Bar Chart */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-600 font-semibold block">पिछले माह से</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    ↑ 18% ज्यादा
                  </span>
                </div>

                {/* Subtle Bar Chart Graphic */}
                <div className="flex items-end gap-1 h-8 px-1">
                  <div className="w-1.5 h-3 bg-emerald-300 rounded-xs"></div>
                  <div className="w-1.5 h-4 bg-emerald-400 rounded-xs"></div>
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-xs"></div>
                  <div className="w-1.5 h-7 bg-emerald-600 rounded-xs"></div>
                  <div className="w-1.5 h-8 bg-emerald-700 rounded-xs"></div>
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">कुल बिक्री</span>
                  <span className="text-sm font-black text-slate-900">1,350 kg</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">कुल ऑर्डर</span>
                  <span className="text-sm font-black text-slate-900">24</span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 2. Today's Market Prices Card (आज का बाजार भाव)       */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  आज का बाजार भाव
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  AGMARKNET
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {marketSummaries.length > 0 ? (
                  marketSummaries.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="font-bold text-slate-800">{item.crop}</span>
                      <span className="font-semibold text-slate-700">₹{item.minPrice / 100} - ₹{item.maxPrice / 100} / kg</span>
                      <span className={`font-bold flex items-center gap-0.5 ${item.trend === 'UP' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.trend === 'UP' ? '↑' : '↓'} ₹{item.pricePerKg}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-slate-400 text-xs font-semibold">
                    मंडी भाव लोड हो रहे हैं...
                  </div>
                )}
              </div>

              {/* View All Prices Button */}
              <Link
                href="/farmer/market-prices"
                className="w-full py-2.5 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center transition-colors border border-emerald-100"
              >
                सभी भाव देखें
              </Link>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 3. AI Assistant Card (कृषि साथी (AI सहायक))          */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
                कृषि साथी <span className="text-slate-500 text-xs font-medium">(AI सहायक)</span>
              </h3>

              {/* AI Message Speech Bubble */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-xl">
                  🤖
                </div>
                <div className="text-xs text-slate-800 font-semibold leading-snug pt-1">
                  नमस्ते रमेश जी! मैं आपकी कैसे मदद कर सकता हूँ?
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <Link
                  href="/farmer/ai-assistant"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Mic className="w-4 h-4 fill-current" />
                  <span>वॉयस से पूछें</span>
                </Link>

                <Link
                  href="/farmer/ai-assistant"
                  className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-all shadow-xs flex-shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </FarmerLayout>
  );
}
