'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Check,
  RefreshCw,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  MapPin,
  Map,
  Compass,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';

export default function DeliveryTrackingPage() {
  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-8 select-none">
        
        {/* ======================================================== */}
        {/* CARD 1: ORDER INFORMATION HEADER CARD                     */}
        {/* ======================================================== */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Left: Product Thumbnail + Info */}
            <div className="flex items-start gap-4">
              <img
                src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=240"
                alt="टमाटर"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
              />
              <div className="space-y-1">
                <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  टमाटर <span className="font-semibold text-slate-700 text-lg">(Tomato)</span>
                </h2>
                <p className="text-sm font-bold text-slate-700">
                  200 kg <span className="mx-1 text-slate-400">•</span> ₹24 / kg
                </p>
                <div className="text-xs text-slate-500 pt-1 space-y-0.5 font-medium">
                  <p>ऑर्डर ID: <strong className="text-slate-900 font-bold">#ORD1241</strong></p>
                  <p>ऑर्डर दिनांक: 18 मई 2024, 11:20 AM</p>
                </div>
              </div>
            </div>

            {/* Right: Delivery Badge + Amount */}
            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3.5 py-1.5 rounded-full border border-emerald-200/80 mb-2 inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                डिलीवरी में है
              </span>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block font-semibold uppercase tracking-wider">
                  कुल राशि
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  ₹4,800
                </span>
                <div className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                  <span>भुगतान: ऑनलाइन</span>
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: DELIVERY STATUS STEPPER CARD                    */}
        {/* ======================================================== */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base md:text-lg text-slate-900">
              डिलीवरी की स्थिति
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <span>अपडेट होगा: हर 2 मिनट में</span>
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow cursor-pointer" />
            </div>
          </div>

          {/* Timeline Stepper Container */}
          <div className="space-y-4 relative pl-6 sm:pl-8 border-l-2 border-slate-200 ml-3 sm:ml-4">
            
            {/* Step 1: Completed */}
            <div className="relative pt-1 pb-3">
              <div className="absolute -left-[37px] sm:-left-[45px] top-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs border-2 border-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    पिकअप के लिए निर्धारित
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">18 मई 2024, 01:15 PM</p>
                </div>
                <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  पूरा हो गया
                </span>
              </div>
            </div>

            {/* Step 2: In Transit / Picked up (Active Highlighted Box) */}
            <div className="relative bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 -ml-4 pl-12 shadow-2xs">
              <div className="absolute left-2.5 top-3.5 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>पिकअप हो गया</span>
                  </h4>
                  <p className="text-slate-600 text-xs mt-0.5 font-medium">18 मई 2024, 01:45 PM</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-xs block">
                    पूरा हो गया
                  </span>
                  <span className="text-xs text-slate-600 font-semibold block mt-0.5">
                    लखनऊ, उत्तर प्रदेश
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Pending - Out for delivery */}
            <div className="relative pt-3 pb-3">
              <div className="absolute -left-[37px] sm:-left-[45px] top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              </div>
              <div>
                <h4 className="font-bold text-slate-500 text-sm sm:text-base">
                  डिलीवरी के लिए रवाना
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  अनुमानित समय: 18 मई 2024, 03:30 PM
                </p>
              </div>
            </div>

            {/* Step 4: Pending - Will be delivered */}
            <div className="relative pt-3">
              <div className="absolute -left-[37px] sm:-left-[45px] top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              </div>
              <div>
                <h4 className="font-bold text-slate-500 text-sm sm:text-base">
                  डिलीवर किया जाएगा
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  अनुमानित समय: 18 मई 2024, 05:00 PM
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 3: LIVE TRACKING MAP & DRIVER CARD                 */}
        {/* ======================================================== */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base md:text-lg text-slate-900">
              लाइव ट्रैकिंग
            </h3>
            <button className="text-xs font-extrabold text-emerald-700 flex items-center gap-1.5 hover:underline bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
              <span>देखें मानचित्र पर</span>
              <Map className="w-4 h-4" />
            </button>
          </div>

          {/* Map View Graphic */}
          <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
            {/* Visual Styled Map Background */}
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
              alt="Map route view"
              className="w-full h-full object-cover opacity-75 contrast-125"
            />
            
            {/* Map Overlay & Route Path */}
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-between px-4 sm:px-10">
              
              {/* Pickup Location Marker Badge */}
              <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-lg text-xs font-bold text-slate-900 space-y-0.5 max-w-[140px] sm:max-w-none">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <MapPin className="w-4 h-4 fill-emerald-600 text-white" />
                  <span className="font-extrabold">आपका स्थान</span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold leading-tight">
                  बैजनापुर, बाराबंकी
                </p>
              </div>

              {/* Truck Icon Moving on Path */}
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl border-2 border-white animate-bounce">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-full mt-1 backdrop-blur-xs">
                  इन-ट्रांजिट
                </span>
              </div>

              {/* Destination Location Marker Badge */}
              <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-lg text-xs font-bold text-slate-900 text-right space-y-0.5 max-w-[140px] sm:max-w-none">
                <div className="flex items-center justify-end gap-1.5 text-red-600">
                  <span className="font-extrabold">डिलीवरी स्थान</span>
                  <MapPin className="w-4 h-4 fill-red-600 text-white" />
                </div>
                <p className="text-[11px] text-slate-600 font-semibold leading-tight">
                  अलंबाग, लखनऊ
                </p>
              </div>

            </div>
          </div>

          {/* Driver Info Bar */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
                alt="संदीप कुमार"
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs flex-shrink-0"
              />
              <div>
                <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                  संदीप कुमार
                </h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  UP32 AB 1234 <span className="mx-1 text-slate-400">•</span> पिकअप वाहन (छोटा ट्रक)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="tel:9812345678"
                className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>कॉल करें</span>
              </a>
              <button className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>मैसेज करें</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM METRICS: 3 GRID TILES                            */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Tile 1: Remaining Distance */}
          <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-100 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-xl font-bold shadow-2xs flex-shrink-0">
              🛣️
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 block">
                दूरी बाकी
              </span>
              <span className="text-xl font-black text-slate-900 leading-tight">
                32 km
              </span>
            </div>
          </div>

          {/* Tile 2: Estimated Duration */}
          <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-100 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-xl font-bold shadow-2xs flex-shrink-0">
              🕐
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 block">
                अनुमानित समय
              </span>
              <span className="text-xl font-black text-slate-900 leading-tight">
                1 घं 45 मि
              </span>
            </div>
          </div>

          {/* Tile 3: Estimated Delivery Time */}
          <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-100 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-xl font-bold shadow-2xs flex-shrink-0">
              📅
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 block">
                अनुमानित डिलीवरी समय
              </span>
              <span className="text-xl font-black text-slate-900 leading-tight">
                आज, 05:00 PM
              </span>
            </div>
          </div>

        </div>

      </div>
    </FarmerLayout>
  );
}
