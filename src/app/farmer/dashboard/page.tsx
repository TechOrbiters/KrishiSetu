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
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { getMarketPriceSummary } from '@/lib/api/client';
import { MarketPriceSummaryCard } from '@/lib/types/market';
import { useFarmerListings } from '@/lib/hooks/useFarmerListings';
import { useFarmerOrders } from '@/lib/hooks/useFarmerOrders';
import { getAccurateCropImage } from '@/lib/cropImages';

export default function FarmerDashboard() {
  const [marketSummaries, setMarketSummaries] = useState<MarketPriceSummaryCard[]>([]);
  const { listings, loading: listingsLoading } = useFarmerListings();
  const { orders, loading: ordersLoading } = useFarmerOrders();

  const totalEarnings = orders
    .filter((o) => o.status === 'DELIVERED' || o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT')
    .reduce((sum, o) => sum + (o.productAmount || 0), 0);

  const totalQuantitySold = orders
    .filter((o) => o.status === 'DELIVERED' || o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT')
    .reduce((sum, o) => sum + (o.quantityKg || 0), 0);

  const totalOrdersCount = orders.length;

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
              {listings.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">अभी कोई उपज लिस्ट नहीं है (No listings yet)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">अपनी पहली उपज लिस्ट करने के लिए नीचे दिए गए बटन पर क्लिक करें</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {listings.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/farmer/listings`}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-1 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={(item as any).imageUrl || (item as any).image || getAccurateCropImage(item.cropNameHindi, undefined, item.cropNameHindi)}
                          alt={item.cropNameHindi}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = getAccurateCropImage(item.cropNameHindi, undefined, item.cropNameHindi); }}
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {item.cropNameHindi}
                              {item.cropNameEnglish && item.cropNameEnglish.toLowerCase() !== item.cropNameHindi.toLowerCase() && (
                                <span className="text-slate-500 font-semibold text-xs ml-1">({item.cropNameEnglish})</span>
                              )}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {item.availableQtyKg ?? item.quantityKg} kg <span className="mx-1 text-slate-300">•</span> ₹{item.askingPricePerKg} / kg
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : item.status === 'LOW_STOCK'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? 'सक्रिय' : item.status === 'LOW_STOCK' ? 'कम स्टॉक' : 'निष्क्रिय'}
                        </span>

                        <div className="text-right hidden sm:block">
                          <span className="font-bold text-xs text-slate-900 block">{item.ordersCount || 0} ऑर्डर</span>
                          <span className="text-[10px] text-slate-400 font-medium">ग्रेड {item.grade}</span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

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
                  हाल के ऑर्डर ({orders.length})
                </h3>
                <Link
                  href="/farmer/orders"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>सभी देखें</span>
                </Link>
              </div>

              {/* Orders List */}
              <div className="space-y-2.5">
                {orders.slice(0, 3).map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/farmer/orders`}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-700">#{ord.orderNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'IN_TRANSIT'
                              ? 'bg-sky-100 text-sky-800'
                              : ord.status === 'ACCEPTED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'DELIVERED'
                            ? 'पूरा'
                            : ord.status === 'IN_TRANSIT'
                            ? 'डिलीवरी में'
                            : ord.status === 'ACCEPTED'
                            ? 'स्वीकार'
                            : 'नया ऑर्डर'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{new Date(ord.createdAt).toLocaleDateString('hi-IN')}</p>
                      <p className="text-xs font-bold text-slate-900 pt-0.5">
                        {ord.cropNameHindi} <span className="text-slate-400 font-normal">•</span> {ord.quantityKg} kg
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">{ord.buyerName}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-base font-black text-emerald-800 block">₹{ord.productAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {ord.deliveryMode === 'SELF_PICKUP' ? 'स्वयं पिकअप' : 'डिलीवरी पार्टनर'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 inline-block ml-auto mt-1" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Orders Button */}
              <Link
                href="/farmer/orders"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
              >
                मेरे सभी ऑर्डर देखें ({orders.length})
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
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-semibold block">कुल कमाई</span>
              </div>

              {/* Green Highlight Box with Bar Chart */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-600 font-semibold block">उपज बिक्री स्थिति</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    {totalOrdersCount > 0 ? 'सक्रिय व्यापार' : 'उपज लिस्ट करें'}
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
                  <span className="text-sm font-black text-slate-900">{totalQuantitySold.toLocaleString('en-IN')} kg</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">कुल ऑर्डर</span>
                  <span className="text-sm font-black text-slate-900">{totalOrdersCount}</span>
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
