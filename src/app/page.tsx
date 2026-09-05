'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight, Eye, EyeOff } from 'lucide-react';

/* ========================================================================= */
/* CUSTOM SVG VECTOR ILLUSTRATIONS (EXACT MATCH TO REFERENCE SCREENSHOT)       */
/* ========================================================================= */

// 1. Sprout Brand Logo
function KisanSetuLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none">
        <path d="M50 90C50 90 48 55 25 35C20 30.7 12 28 5 30C15 48 35 60 50 90Z" fill="#15803D" />
        <path d="M50 90C50 90 52 50 78 28C84 23 92 20 98 21C90 40 70 55 50 90Z" fill="#16A34A" />
        <path d="M50 90C50 90 45 40 50 10C53 25 60 45 50 90Z" fill="#22C55E" />
      </svg>
      <span className="font-extrabold text-2xl text-[#15803D] tracking-tight font-sans">
        KisanSetu
      </span>
    </div>
  );
}

// 2. Farmer Vector Icon Badge
function FarmerIcon() {
  return (
    <div className="w-20 h-20 rounded-full bg-[#E6F4EA] flex items-center justify-center flex-shrink-0 border border-[#CEEAD6]">
      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
        {/* Face */}
        <circle cx="50" cy="45" r="18" fill="#FCD34D" />
        {/* Turban */}
        <path d="M30 35C30 22 40 16 50 16C60 16 70 22 70 35C65 30 55 28 50 28C45 28 35 30 30 35Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M32 28C40 22 60 22 68 28" stroke="#E2E8F0" strokeWidth="3" />
        {/* Moustache */}
        <path d="M42 49C46 52 50 51 50 51C50 51 54 52 58 49C60 48 62 51 58 53C53 55 50 52 50 52C50 52 47 55 42 53C38 51 40 48 42 49Z" fill="#1E293B" />
        {/* Green Shirt */}
        <path d="M25 80C25 62 35 58 50 58C65 58 75 62 75 80V90H25V80Z" fill="#15803D" />
        {/* Green Gamcha Scarf */}
        <path d="M38 58L42 85M62 58L58 85" stroke="#166534" strokeWidth="4" strokeLinecap="round" />
        {/* Wheat Stalk */}
        <path d="M72 75L78 45" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
        <path d="M78 45C76 42 72 40 70 42C74 44 76 47 78 45Z" fill="#F59E0B" />
        <path d="M76 52C72 50 68 48 66 50C70 52 74 54 76 52Z" fill="#F59E0B" />
      </svg>
    </div>
  );
}

// 3. Buyer Vector Icon Badge (Shopping Cart with Produce)
function BuyerIcon() {
  return (
    <div className="w-20 h-20 rounded-full bg-[#E8F0FE] flex items-center justify-center flex-shrink-0 border border-[#D2E3FC]">
      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
        {/* Produce inside Cart */}
        <circle cx="42" cy="38" r="8" fill="#EF4444" /> {/* Tomato */}
        <circle cx="56" cy="36" r="9" fill="#22C55E" /> {/* Broccoli */}
        <ellipse cx="48" cy="32" rx="7" ry="10" fill="#F59E0B" /> {/* Carrot */}
        {/* Shopping Cart Body */}
        <path d="M25 30H32L40 60H72L78 35H34" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#3B82F6" fillOpacity="0.2" />
        {/* Wheels */}
        <circle cx="44" cy="72" r="5" fill="#1E293B" />
        <circle cx="68" cy="72" r="5" fill="#1E293B" />
      </svg>
    </div>
  );
}

// 4. Transporter Vector Icon Badge (Truck)
function TransporterIcon() {
  return (
    <div className="w-20 h-20 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border border-[#FDE68A]">
      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
        {/* Truck Cargo Box */}
        <rect x="20" y="32" width="40" height="30" rx="3" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
        {/* Truck Cabin */}
        <path d="M60 42H72C75 42 78 45 78 48V62H60V42Z" fill="#F97316" />
        {/* Windshield */}
        <path d="M64 45H72L75 52H64V45Z" fill="#38BDF8" />
        {/* Wheels */}
        <circle cx="32" cy="65" r="7" fill="#1E293B" />
        <circle cx="32" cy="65" r="3" fill="#94A3B8" />
        <circle cx="68" cy="65" r="7" fill="#1E293B" />
        <circle cx="68" cy="65" r="3" fill="#94A3B8" />
      </svg>
    </div>
  );
}

// 5. Admin Vector Icon Badge (Purple Building / Institution)
function AdminIcon() {
  return (
    <div className="w-20 h-20 rounded-full bg-[#F3E8FF] flex items-center justify-center flex-shrink-0 border border-[#E9D5FF]">
      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
        {/* Triangular Pediment Roof */}
        <path d="M20 38L50 22L80 38H20Z" fill="#7C3AED" />
        {/* Roof Base */}
        <rect x="22" y="38" width="56" height="5" fill="#6D28D9" />
        {/* Columns */}
        <rect x="26" y="43" width="8" height="25" fill="#8B5CF6" />
        <rect x="41" y="43" width="8" height="25" fill="#8B5CF6" />
        <rect x="56" y="43" width="8" height="25" fill="#8B5CF6" />
        <rect x="71" y="43" width="8" height="25" fill="#8B5CF6" />
        {/* Base Steps */}
        <rect x="20" y="68" width="60" height="5" fill="#6D28D9" />
        <rect x="16" y="73" width="68" height="5" fill="#5B21B6" />
      </svg>
    </div>
  );
}

// 6. Bottom Pill Icons
function RupeePillIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs">
      ₹
    </div>
  );
}

function DirectPillIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </div>
  );
}

function TruckPillIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    </div>
  );
}

function RobotPillIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="8.5" cy="15.5" r="1.5" />
        <circle cx="15.5" cy="15.5" r="1.5" />
        <path d="M12 2v6" />
        <circle cx="12" cy="2" r="1" />
      </svg>
    </div>
  );
}

/* ========================================================================= */
/* MAIN LANDING PAGE COMPONENT (1:1 PIXEL RECREATION)                        */
/* ========================================================================= */

export default function MasterLandingPage() {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans select-none antialiased relative">
      
      {/* ========================================================= */}
      {/* DEV PIXEL-PERFECT REFERENCE OVERLAY TOGGLE               */}
      {/* ========================================================= */}
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700">
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className="flex items-center gap-1.5 font-bold hover:text-emerald-400 transition-colors"
        >
          {showOverlay ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
          <span>{showOverlay ? 'Hide Reference Overlay' : 'Compare Pixel Overlay (50%)'}</span>
        </button>
      </div>

      {showOverlay && (
        <div className="absolute inset-0 z-40 pointer-events-none opacity-50 overflow-hidden flex justify-center">
          <img
            src="/assets/kisan-setu/landing-reference.png"
            alt="Reference Landing"
            className="w-full max-w-[1299px] h-auto object-top"
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HEADER                                                 */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-slate-100 px-6 sm:px-12 py-3.5 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <KisanSetuLogo />

        {/* Language Pill Dropdown */}
        <div className="relative">
          <button className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs">
            <span className="text-sm">🌐</span>
            <span>भाषा: हिन्दी</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION WITH DECORATIVE ARCS & IMAGES             */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 relative">
        
        {/* Large Decorative Sweep Arc Top Right */}
        <div className="absolute top-0 right-0 w-[380px] h-[380px] rounded-full border-[32px] border-[#15803D]/15 pointer-events-none -mr-32 -mt-20 blur-[1px]" />

        {/* Hero Section Canvas */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-4 min-h-[320px]">
          
          {/* Left Farmer Portrait */}
          <div className="flex-shrink-0 w-64 sm:w-80 h-72 sm:h-84 relative z-10 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600"
              alt="Indian Farmer Portrait"
              className="w-full h-full object-cover object-top rounded-full drop-shadow-md border-4 border-white"
            />
          </div>

          {/* Center Headline & Subtext */}
          <div className="flex-1 text-center space-y-3.5 z-10 max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-[46px] font-black text-[#14532D] tracking-tight leading-tight">
              किसान से सीधा बाज़ार तक
            </h1>

            <div className="flex items-center justify-center gap-3 text-[#16A34A] font-extrabold text-base sm:text-xl flex-wrap">
              <span>बेहतर दाम</span>
              <span className="text-[#16A34A] font-bold">•</span>
              <span>आसान बिक्री</span>
              <span className="text-[#16A34A] font-bold">•</span>
              <span>स्मार्ट डिलीवरी</span>
            </div>

            <p className="text-slate-700 font-semibold text-xs sm:text-base leading-relaxed max-w-md mx-auto">
              किसानों को सीधे खरीदारों से जोड़ने वाला<br />
              सरल और भरोसेमंद डिजिटल बाज़ार।
            </p>

            {/* Small Green Accent Underline Bar */}
            <div className="w-12 h-1 bg-[#16A34A] rounded-full mx-auto mt-2" />
          </div>

          {/* Right Fresh Produce Basket Image */}
          <div className="flex-shrink-0 w-64 sm:w-80 h-64 sm:h-72 relative z-10 flex items-center justify-center hidden md:flex">
            <img
              src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=600"
              alt="Fresh Produce Basket"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

        </div>

        {/* ========================================================= */}
        {/* 3. "आप कौन हैं?" ROLE SELECTOR SECTION                      */}
        {/* ========================================================= */}
        <section className="space-y-5 relative z-10">
          
          {/* Section Title */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center justify-center gap-3">
              <span className="text-[#16A34A] font-extrabold tracking-widest">≫</span>
              <span>आप कौन हैं?</span>
              <span className="text-[#16A34A] font-extrabold tracking-widest">≪</span>
            </h2>
          </div>

          {/* 4 Role Selector Cards Grid (2x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            
            {/* 1. किसान (Farmer) Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <FarmerIcon />
                <div>
                  <h3 className="font-extrabold text-xl text-[#15803D] leading-tight">किसान</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">अपनी उपज बेचें</p>
                </div>
              </div>
              <Link
                href="/auth/farmer"
                className="bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs"
              >
                <span>प्रवेश करें</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2. खरीदार (Buyer) Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BuyerIcon />
                <div>
                  <h3 className="font-extrabold text-xl text-[#1D4ED8] leading-tight">खरीदार</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">सीधे खरीदें</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/farmer/orders')}
                className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs"
              >
                <span>प्रवेश करें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. परिवहनकर्ता (Transporter) Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <TransporterIcon />
                <div>
                  <h3 className="font-extrabold text-xl text-[#EA580C] leading-tight">परिवहनकर्ता</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">डिलीवरी सेवाएं दें</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/farmer/delivery')}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs"
              >
                <span>प्रवेश करें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 4. व्यवस्थापक (FPO / Admin) Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <AdminIcon />
                <div>
                  <h3 className="font-extrabold text-xl text-[#7C3AED] leading-tight">व्यवस्थापक</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">प्लेटफ़ॉर्म प्रबंधन करें</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/farmer/fpo/members')}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs"
              >
                <span>प्रवेश करें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. BOTTOM FEATURE BAR (4 PILLS WITH DIVIDERS)             */}
        {/* ========================================================= */}
        <section className="bg-[#F0FDF4] rounded-2xl border border-[#DCFCE7] p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          
          {/* Pill 1 */}
          <div className="flex items-center gap-3 p-2 lg:border-r border-slate-200/60">
            <RupeePillIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">बेहतर दाम</h4>
              <p className="text-[11px] text-slate-500 font-semibold">किसानों को उचित मूल्य</p>
            </div>
          </div>

          {/* Pill 2 */}
          <div className="flex items-center gap-3 p-2 lg:border-r border-slate-200/60">
            <DirectPillIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">सीधे संपर्क</h4>
              <p className="text-[11px] text-slate-500 font-semibold">किसान से खरीदार तक सीधा जुड़ाव</p>
            </div>
          </div>

          {/* Pill 3 */}
          <div className="flex items-center gap-3 p-2 lg:border-r border-slate-200/60">
            <TruckPillIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">आसान डिलीवरी</h4>
              <p className="text-[11px] text-slate-500 font-semibold">स्मार्ट और समय पर डिलीवरी</p>
            </div>
          </div>

          {/* Pill 4 */}
          <div className="flex items-center gap-3 p-2">
            <RobotPillIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">स्मार्ट समाधान</h4>
              <p className="text-[11px] text-slate-500 font-semibold">AI आधारित बाजार और लॉजिस्टिक्स</p>
            </div>
          </div>

        </section>

      </main>

      {/* ========================================================= */}
      {/* 5. FOOTER                                                 */}
      {/* ========================================================= */}
      <footer className="w-full bg-white border-t border-slate-100 py-3.5 text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-2 relative z-10">
        <span className="text-base">🌿</span>
        <span>किसानों की समृद्धि, देश की प्रगति।</span>
      </footer>

    </div>
  );
}
