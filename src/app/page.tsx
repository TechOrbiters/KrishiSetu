'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

/* ========================================================================= */
/* SVG ICONS & ILLUSTRATIONS                                                  */
/* ========================================================================= */

function KrishiSetuLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
      <svg className="w-10 h-10 flex-shrink-0" viewBox="0 0 100 100" fill="none">
        <path d="M50 92C50 92 48 54 22 32C16 27 8 24 2 26C14 46 34 60 50 92Z" fill="#15803D" />
        <path d="M50 92C50 92 52 50 80 27C86 22 94 19 100 21C90 42 68 55 50 92Z" fill="#16A34A" />
        <path d="M50 92C50 92 46 38 50 10C53 26 60 46 50 92Z" fill="#22C55E" />
      </svg>
      <span className="font-extrabold text-[28px] tracking-tight leading-none" style={{ fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif" }}>
        <span style={{ color: '#15803D' }}>Krishi</span>
        <span style={{ color: '#1a1a1a' }}>Setu</span>
      </span>
    </Link>
  );
}

function LeftLeafBranch() {
  return (
    <svg className="w-7 h-5 flex-shrink-0" viewBox="0 0 32 20" fill="none">
      <path d="M2 10C8 10 16 11 28 10" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 10C16 6 22 4 27 5C26 8 22 10 14 10Z" fill="#16A34A" />
      <path d="M18 10C20 14 24 16 29 15C28 12 24 10 18 10Z" fill="#16A34A" />
      <path d="M6 10C8 7 13 6 17 7C16 9 13 10 6 10Z" fill="#16A34A" />
      <circle cx="30" cy="10" r="2" fill="#15803D" />
    </svg>
  );
}

function RightLeafBranch() {
  return (
    <svg className="w-7 h-5 flex-shrink-0 scale-x-[-1]" viewBox="0 0 32 20" fill="none">
      <path d="M2 10C8 10 16 11 28 10" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 10C16 6 22 4 27 5C26 8 22 10 14 10Z" fill="#16A34A" />
      <path d="M18 10C20 14 24 16 29 15C28 12 24 10 18 10Z" fill="#16A34A" />
      <path d="M6 10C8 7 13 6 17 7C16 9 13 10 6 10Z" fill="#16A34A" />
      <circle cx="30" cy="10" r="2" fill="#15803D" />
    </svg>
  );
}

function FarmerAvatar() {
  return (
    <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full bg-[#E6F4EA] flex items-center justify-center flex-shrink-0 border-2 border-[#CEEAD6] shadow-sm">
      <svg className="w-16 h-16 sm:w-[72px] sm:h-[72px]" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="40" r="16" fill="#FBD38D" />
        <path d="M28 34C28 20 38 12 50 12C62 12 72 20 72 34C66 28 58 26 50 26C42 26 34 28 28 34Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.8" />
        <path d="M42 45C46 48 50 47 50 47C50 47 54 48 58 45C60 44 62 47 58 49C54 51 50 48 50 48C50 48 46 51 42 49C38 47 40 44 42 45Z" fill="#1E293B" />
        <circle cx="44" cy="37" r="2" fill="#1E293B" />
        <circle cx="56" cy="37" r="2" fill="#1E293B" />
        <path d="M24 82C24 62 34 58 50 58C66 58 76 62 76 82V92H24V82Z" fill="#15803D" />
        <path d="M74 76L81 40" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
        <path d="M81 40C79 37 74 35 72 37C76 39 79 42 81 40Z" fill="#F59E0B" />
        <path d="M79 48C75 46 70 44 68 46C72 48 76 50 79 48Z" fill="#F59E0B" />
      </svg>
    </div>
  );
}

function BuyerAvatar() {
  return (
    <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full bg-[#E8F0FE] flex items-center justify-center flex-shrink-0 border-2 border-[#C8D8FC] shadow-sm">
      <svg className="w-16 h-16 sm:w-[72px] sm:h-[72px]" viewBox="0 0 100 100" fill="none">
        <circle cx="44" cy="44" r="8" fill="#EF4444" />
        <circle cx="58" cy="42" r="9" fill="#22C55E" />
        <ellipse cx="51" cy="35" rx="7" ry="10" fill="#F59E0B" />
        <path d="M16 26H24L34 66H76L84 34H28" stroke="#2563EB" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="#EFF6FF" />
        <circle cx="40" cy="76" r="6.5" fill="#1E293B" />
        <circle cx="40" cy="76" r="2.5" fill="#94A3B8" />
        <circle cx="70" cy="76" r="6.5" fill="#1E293B" />
        <circle cx="70" cy="76" r="2.5" fill="#94A3B8" />
      </svg>
    </div>
  );
}

function TransporterAvatar() {
  return (
    <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 border-2 border-[#FDE68A] shadow-sm">
      <svg className="w-16 h-16 sm:w-[72px] sm:h-[72px]" viewBox="0 0 100 100" fill="none">
        <rect x="14" y="32" width="46" height="32" rx="4" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
        <path d="M60 42H76C79 42 82 45 82 48V64H60V42Z" fill="#EA580C" />
        <path d="M64 45H75L78 54H64V45Z" fill="#BAE6FD" opacity="0.9" />
        <circle cx="28" cy="68" r="8.5" fill="#1E293B" />
        <circle cx="28" cy="68" r="3.5" fill="#94A3B8" />
        <circle cx="70" cy="68" r="8.5" fill="#1E293B" />
        <circle cx="70" cy="68" r="3.5" fill="#94A3B8" />
      </svg>
    </div>
  );
}

function AdminAvatar() {
  return (
    <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full bg-[#F3E8FF] flex items-center justify-center flex-shrink-0 border-2 border-[#E9D5FF] shadow-sm">
      <svg className="w-16 h-16 sm:w-[72px] sm:h-[72px]" viewBox="0 0 100 100" fill="none">
        <path d="M16 36L50 17L84 36H16Z" fill="#7C3AED" />
        <rect x="18" y="36" width="64" height="5" rx="1" fill="#6D28D9" />
        <rect x="23" y="41" width="9" height="28" rx="2" fill="#8B5CF6" />
        <rect x="37" y="41" width="9" height="28" rx="2" fill="#8B5CF6" />
        <rect x="54" y="41" width="9" height="28" rx="2" fill="#8B5CF6" />
        <rect x="68" y="41" width="9" height="28" rx="2" fill="#8B5CF6" />
        <rect x="16" y="69" width="68" height="5" rx="1" fill="#6D28D9" />
        <rect x="12" y="74" width="76" height="6" rx="1.5" fill="#5B21B6" />
      </svg>
    </div>
  );
}

function RupeeFeatureIcon() {
  return (
    <div className="w-11 h-11 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round">
        <path d="M6 3h12M6 8h12M10 21L6 8" />
        <path d="M6 8a6 6 0 0 0 6 6 6 6 0 0 0 6-6" />
      </svg>
    </div>
  );
}

function LinkFeatureIcon() {
  return (
    <div className="w-11 h-11 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </div>
  );
}

function TruckFeatureIcon() {
  return (
    <div className="w-11 h-11 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    </div>
  );
}

function RobotFeatureIcon() {
  return (
    <div className="w-11 h-11 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="8.5" cy="15.5" r="1.5" />
        <circle cx="15.5" cy="15.5" r="1.5" />
        <path d="M12 2v6" />
        <circle cx="12" cy="2" r="1" />
        <path d="M8 11V9a4 4 0 0 1 8 0v2" />
      </svg>
    </div>
  );
}

/* ========================================================================= */
/* MAIN LANDING PAGE COMPONENT                                               */
/* ========================================================================= */

export default function MasterLandingPage() {
  const router = useRouter();
  const { language, setLanguage, languages, currentLanguageObj, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col font-sans select-none antialiased"
      style={{
        background: '#FAFBF9',
        fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
        color: '#1E293B',
      }}
    >
      {/* HEADER */}
      <header
        className="w-full bg-white sticky top-0 z-40 flex items-center justify-between px-6 sm:px-10 lg:px-14"
        style={{
          height: '70px',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 6px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <KrishiSetuLogo />
        <div className="flex items-center gap-2.5">
          <Link
            href="/auth/farmer"
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'FARMER');
            }}
            className="text-xs font-bold text-[#15803D] bg-[#E6F4EA] hover:bg-[#CEEAD6] px-3 py-1.5 rounded-xl border border-[#CEEAD6] transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>🌾</span>
            <span>{t('farmerLogin')}</span>
          </Link>
          <Link
            href="/auth/buyer"
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'BUYER');
            }}
            className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors hidden sm:flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span>क्रेता / Buyer</span>
          </Link>
          <Link
            href="/auth/transporter"
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'TRANSPORTER');
            }}
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors hidden md:flex items-center gap-1.5"
          >
            <span>🚚</span>
            <span>परिवहन / Transporter</span>
          </Link>
          <div className="relative" data-no-translate="true">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              style={{ minHeight: '40px' }}
            >
              <Globe className="w-4 h-4 text-slate-600" />
              <span>{t('languageLabel')}: {currentLanguageObj?.nativeName || 'हिंदी'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {langMenuOpen && (
              <div className="language-dropdown-menu absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${language === l.code ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span>{l.nativeName}</span>
                    <span className="text-xs text-slate-400">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        className="w-full relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(175deg, #ECF9EE 0%, #FAFBF9 45%, #FFFFFF 100%)',
          minHeight: '360px',
          borderBottom: '1px solid rgba(22, 163, 74, 0.08)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute hidden md:block"
            style={{
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22, 163, 74, 0.08) 0%, rgba(22, 163, 74, 0) 70%)',
              top: '-60px',
              left: '6%',
            }}
          />
          <div
            className="absolute hidden lg:block"
            style={{
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              border: '32px solid #22C55E',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              opacity: 0.85,
              top: '-70px',
              right: '-90px',
              transform: 'rotate(15deg)',
            }}
          />
        </div>

        {/* LEFT: Farmer Image */}
        <div
          className="hidden md:flex absolute left-0 bottom-0 top-0 items-end justify-start pointer-events-none select-none z-[2]"
          style={{ maxWidth: '38%', height: '100%' }}
        >
          <img
            src="/assets/kisan-setu/Farmer.jpg"
            alt="Indian Farmer"
            style={{
              width: 'auto',
              height: '100%',
              maxHeight: '380px',
              maxWidth: '100%',
              objectFit: 'contain',
              objectPosition: 'left bottom',
              display: 'block',
              maskImage: 'linear-gradient(to right, black 0%, black 42%, transparent 92%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 42%, transparent 92%)',
            }}
          />
        </div>

        {/* CENTER: Hero Text */}
        <div className="relative z-10 w-full max-w-[620px] mx-auto text-center py-8 sm:py-10 px-4">
          <h1
            className="font-black leading-tight tracking-tight mb-3"
            style={{
              fontSize: 'clamp(32px, 4.4vw, 54px)',
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              letterSpacing: '-0.5px',
              lineHeight: 1.18,
            }}
          >
            {language === 'hi' ? (
              <>
                <span style={{ color: '#16A34A' }}>किसान</span>
                <span style={{ color: '#1E293B' }}> से सीधा </span>
                <span style={{ color: '#16A34A' }}>बाज़ार</span>
                <span style={{ color: '#1E293B' }}> तक</span>
              </>
            ) : (
              <span style={{ color: '#15803D' }}>{t('heroTitle')}</span>
            )}
          </h1>
          <div
            className="flex items-center justify-center gap-3 flex-wrap mb-3 font-bold"
            style={{
              color: '#16A34A',
              fontSize: 'clamp(14px, 1.8vw, 19px)',
              fontFamily: "'Noto Sans Devanagari', sans-serif",
            }}
          >
            <span>{t('heroTagline1')}</span>
            <span className="text-emerald-400 font-normal">•</span>
            <span>{t('heroTagline2')}</span>
            <span className="text-emerald-400 font-normal">•</span>
            <span>{t('heroTagline3')}</span>
          </div>
          <p
            className="leading-relaxed mb-4 text-slate-700 font-medium"
            style={{
              fontSize: 'clamp(13.5px, 1.4vw, 16px)',
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              lineHeight: 1.6,
            }}
          >
            {t('heroDesc')}
          </p>
          <div
            className="mx-auto"
            style={{
              width: '48px',
              height: '3.5px',
              background: '#16A34A',
              borderRadius: '9999px',
            }}
          />
        </div>

        {/* RIGHT: Vegetable Image */}
        <div
          className="hidden md:flex absolute right-0 bottom-0 top-0 items-end justify-end pointer-events-none select-none z-[2]"
          style={{ maxWidth: '38%', height: '100%' }}
        >
          <img
            src="/assets/kisan-setu/Vegetable.jpg"
            alt="Fresh Vegetables Produce"
            style={{
              width: 'auto',
              height: '100%',
              maxHeight: '360px',
              maxWidth: '100%',
              objectFit: 'contain',
              objectPosition: 'right bottom',
              display: 'block',
              maskImage: 'linear-gradient(to left, black 0%, black 48%, transparent 92%)',
              WebkitMaskImage: 'linear-gradient(to left, black 0%, black 48%, transparent 92%)',
            }}
          />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8">

        {/* Who are you Section */}
        <div className="text-center pt-6 pb-4">
          <h2
            className="inline-flex items-center gap-3 font-extrabold text-slate-800"
            style={{
              fontSize: 'clamp(20px, 2.4vw, 26px)',
              fontFamily: "'Noto Sans Devanagari', sans-serif",
            }}
          >
            <LeftLeafBranch />
            <span>{t('whoAreYou')}</span>
            <RightLeafBranch />
          </h2>
        </div>

        {/* 2x2 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

          {/* Farmer */}
          <Link
            href="/auth/farmer"
            onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'FARMER'); }}
            className="bg-white flex items-center justify-between gap-4 p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer group block"
            style={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-4">
              <FarmerAvatar />
              <div>
                <h3 className="font-black leading-tight group-hover:text-emerald-800 transition-colors" style={{ fontSize: '22px', color: '#15803D', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('roleFarmerTitle')}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{t('roleFarmerDesc')}</p>
              </div>
            </div>
            <span
              className="font-bold text-sm text-white flex-shrink-0 px-5 py-2.5 transition-all group-hover:opacity-95 group-hover:scale-[1.02] active:scale-[0.98] inline-block text-center"
              style={{ background: '#15803D', borderRadius: '10px', boxShadow: '0 2px 8px rgba(21,128,61,0.32)', whiteSpace: 'nowrap' }}
            >
              {t('enterPortalWithArrow')}
            </span>
          </Link>

          {/* Buyer */}
          <Link
            href="/auth/buyer"
            onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'BUYER'); }}
            className="bg-white flex items-center justify-between gap-4 p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer group block"
            style={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-4">
              <BuyerAvatar />
              <div>
                <h3 className="font-black leading-tight group-hover:text-blue-800 transition-colors" style={{ fontSize: '22px', color: '#1D4ED8', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('roleBuyerTitle')}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{t('roleBuyerDesc')}</p>
              </div>
            </div>
            <span
              className="font-bold text-sm text-white flex-shrink-0 px-5 py-2.5 transition-all group-hover:opacity-95 group-hover:scale-[1.02] active:scale-[0.98] inline-block text-center"
              style={{ background: '#1D4ED8', borderRadius: '10px', boxShadow: '0 2px 8px rgba(29,78,216,0.32)', whiteSpace: 'nowrap' }}
            >
              {t('enterPortalWithArrow')}
            </span>
          </Link>

          {/* Transporter */}
          <Link
            href="/auth/transporter"
            onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'TRANSPORTER'); }}
            className="bg-white flex items-center justify-between gap-4 p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer group block"
            style={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-4">
              <TransporterAvatar />
              <div>
                <h3 className="font-black leading-tight group-hover:text-orange-700 transition-colors" style={{ fontSize: '22px', color: '#EA580C', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('roleTransporterTitle')}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{t('roleTransporterDesc')}</p>
              </div>
            </div>
            <span
              className="font-bold text-sm text-white flex-shrink-0 px-5 py-2.5 transition-all group-hover:opacity-95 group-hover:scale-[1.02] active:scale-[0.98] inline-block text-center"
              style={{ background: '#EA580C', borderRadius: '10px', boxShadow: '0 2px 8px rgba(234,88,12,0.32)', whiteSpace: 'nowrap' }}
            >
              {t('enterPortalWithArrow')}
            </span>
          </Link>

          {/* Admin */}
          <Link
            href="/admin/login"
            onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('krishi_active_role', 'ADMIN'); }}
            className="bg-white flex items-center justify-between gap-4 p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer group block"
            style={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-4">
              <AdminAvatar />
              <div>
                <h3 className="font-black leading-tight group-hover:text-purple-800 transition-colors" style={{ fontSize: '22px', color: '#7C3AED', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t('roleAdminTitle')}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{t('roleAdminDesc')}</p>
              </div>
            </div>
            <span
              className="font-bold text-sm text-white flex-shrink-0 px-5 py-2.5 transition-all group-hover:opacity-95 group-hover:scale-[1.02] active:scale-[0.98] inline-block text-center"
              style={{ background: '#7C3AED', borderRadius: '10px', boxShadow: '0 2px 8px rgba(124,58,237,0.32)', whiteSpace: 'nowrap' }}
            >
              {t('enterPortalWithArrow')}
            </span>
          </Link>

        </div>

        {/* Feature Strip */}
        <div
          className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '16px', overflow: 'hidden' }}
        >
          <div className="flex items-center gap-3.5 p-4 sm:p-5 lg:border-r border-b sm:border-b-0" style={{ borderColor: 'rgba(21,128,61,0.12)' }}>
            <RupeeFeatureIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{t('vp1Title')}</h4>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{t('vp1Desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5 lg:border-r border-b sm:border-b-0" style={{ borderColor: 'rgba(21,128,61,0.12)' }}>
            <LinkFeatureIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{t('vp2Title')}</h4>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{t('vp2Desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5 lg:border-r border-b sm:border-b-0" style={{ borderColor: 'rgba(21,128,61,0.12)' }}>
            <TruckFeatureIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{t('vp4Title')}</h4>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{t('vp4Desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 sm:p-5">
            <RobotFeatureIcon />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{t('vp3Title')}</h4>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{t('vp3Desc')}</p>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer
        className="w-full bg-white text-center py-3.5 flex items-center justify-center gap-2"
        style={{
          borderTop: '1px solid #E5E7EB',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
          fontFamily: "'Noto Sans Devanagari', sans-serif",
        }}
      >
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z" />
        </svg>
        <span>{t('trustLine')}</span>
      </footer>

    </div>
  );
}
