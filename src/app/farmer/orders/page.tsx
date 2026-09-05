'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, MapPin, Truck, User, Star, Clock, CheckCircle2 } from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';

export default function OrdersListPage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            🛍️
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">मेरे ऑर्डर (Orders)</h1>
            <p className="text-xs text-slate-500 font-medium">यहाँ आपके सभी ऑर्डर की जानकारी देखें</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: 'ALL', label: 'सभी ऑर्डर (12)' },
            { id: 'NEW', label: 'नए ऑर्डर (3)' },
            { id: 'ACCEPTED', label: 'स्वीकार किए (5)' },
            { id: 'IN_DELIVERY', label: 'डिलीवरी में (3)' },
            { id: 'COMPLETED', label: 'पूरे हुए (8)' },
            { id: 'CANCELLED', label: 'रद्द (1)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white font-extrabold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Cards Container */}
        <div className="space-y-4">
          {/* Card 1: नया ऑर्डर (Wheat) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=200"
                  alt="गेहूँ"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-md inline-block">
                    नया ऑर्डर
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">गेहूँ (Wheat)</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-700">500 kg · ₹22 / kg</p>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <p>
                      खरीदार: <strong className="text-slate-900">कृषि भंडार स्टोर, लखनऊ</strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>लखनऊ, उत्तर प्रदेश</span>
                    </p>
                    <p className="text-[11px] text-slate-400">#ORD1245 · 20 मई 2024, 10:30 AM</p>
                  </div>
                </div>
              </div>

              {/* Right Price & Buttons */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">कुल राशि</span>
                  <span className="text-xl font-extrabold text-slate-900">₹11,000</span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 justify-start md:justify-end">
                    डिलीवरी चाहिए <Truck className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-initial bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1">
                    ✓ ऑर्डर स्वीकार करें
                  </button>
                  <button className="bg-white text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-slate-50">
                    ✕ रद्द करें
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Alert Banner */}
            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>⏱️ कृपया 12 घंटे के अंदर ऑर्डर स्वीकार करें</span>
            </div>
          </div>

          {/* Card 2: स्वीकार किया गया (Potato) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=200"
                  alt="आलू"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-md inline-block">
                    स्वीकार किया गया
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">आलू (Potato)</h3>
                  <p className="text-xs font-bold text-slate-700">300 kg · ₹18 / kg</p>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <p>
                      खरीदार: <strong className="text-slate-900">फूड प्लाजा, कानपुर</strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>कानपुर, उत्तर प्रदेश</span>
                    </p>
                    <p className="text-[11px] text-slate-400">#ORD1243 · 19 मई 2024, 04:15 PM</p>
                  </div>
                </div>
              </div>

              {/* Right Price & Button */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">कुल राशि</span>
                  <span className="text-xl font-extrabold text-slate-900">₹5,400</span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 justify-start md:justify-end">
                    <User className="w-3.5 h-3.5 text-slate-500" /> स्वयं लेने आएगा
                  </span>
                </div>

                <Link
                  href="/farmer/orders/ord_1243"
                  className="bg-white border border-emerald-700 text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  ऑर्डर विवरण देखें
                </Link>
              </div>
            </div>

            {/* Bottom Alert Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>✓ ऑर्डर स्वीकार हो चुका है</span>
            </div>
          </div>

          {/* Card 3: डिलीवरी में (Tomato) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=200"
                  alt="टमाटर"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="bg-sky-50 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-md inline-block">
                    डिलीवरी में
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">टमाटर (Tomato)</h3>
                  <p className="text-xs font-bold text-slate-700">200 kg · ₹24 / kg</p>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <p>
                      खरीदार: <strong className="text-slate-900">होटल ग्रीन लीफ</strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>लखनऊ, उत्तर प्रदेश</span>
                    </p>
                    <p className="text-[11px] text-slate-400">#ORD1241 · 18 मई 2024, 11:20 AM</p>
                  </div>
                </div>
              </div>

              {/* Right Price & Tracking Button */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">कुल राशि</span>
                  <span className="text-xl font-extrabold text-slate-900">₹4,800</span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 justify-start md:justify-end">
                    डिलीवरी <Truck className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                </div>

                <Link
                  href="/farmer/delivery/ord_1241"
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>डिलीवरी ट्रैक करें</span>
                </Link>
              </div>
            </div>

            {/* Bottom Alert Banner */}
            <div className="bg-sky-50/80 border border-sky-200/80 p-3 rounded-xl text-xs text-sky-900 font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>🚚 आपका सामान रास्ते में है</span>
            </div>
          </div>

          {/* Card 4: पूरा हुआ (Okra) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1425543103986-22bad73d384a?auto=format&fit=crop&q=80&w=200"
                  alt="भिंडी"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-md inline-block">
                    पूरा हुआ
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">भिंडी (Okra)</h3>
                  <p className="text-xs font-bold text-slate-700">100 kg · ₹30 / kg</p>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <p>
                      खरीदार: <strong className="text-slate-900">वीमार्ट स्टोर</strong>
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>लखनऊ, उत्तर प्रदेश</span>
                    </p>
                    <p className="text-[11px] text-slate-400">#ORD1239 · 16 मई 2024, 02:45 PM</p>
                  </div>
                </div>
              </div>

              {/* Right Price, Rating & Button */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-3">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">कुल राशि</span>
                  <span className="text-xl font-extrabold text-slate-900">₹3,000</span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5 justify-start md:justify-end">
                    डिलीवरी <Truck className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Link
                    href="/farmer/orders/ord_1239"
                    className="bg-white border border-emerald-700 text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-2xs"
                  >
                    पूर्ण विवरण देखें
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Alert Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>✓ डिलीवरी पूरी हो गई</span>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
