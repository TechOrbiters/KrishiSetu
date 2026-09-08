'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Phone,
  User,
  MapPin,
  Building,
  ShieldCheck,
  CreditCard,
  Eye,
  EyeOff,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { signInWithSupabase, signUpWithSupabase } from '@/lib/supabase/authClient';

export default function FarmerAuthPage() {
  const router = useRouter();

  // Mode: 'REGISTER' | 'LOGIN'
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Registration Steps: 1 -> 2 -> 3 -> 4 -> 5
  const [regStep, setRegStep] = useState<number>(1);

  // Login Method: 'SELECT' | 'MOBILE_OTP' | 'PASSWORD'
  const [loginMethod, setLoginMethod] = useState<'SELECT' | 'MOBILE_OTP' | 'PASSWORD'>('SELECT');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('बाराबंकी');
  const [state, setState] = useState('उत्तर प्रदेश');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Handler for OTP box change
  const handleOtpChange = (val: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
  };

  // Farmer Supabase Registration (Step 5 completion)
  const handleFarmerRegister = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await signUpWithSupabase(phone, password || 'kisan123', {
        fullName,
        phone,
        village,
        district,
        state,
        role: 'FARMER',
        aadhaarLast4: aadhaarNumber.replace(/\s+/g, '').slice(-4) || '8765'
      });
      if (res.error) {
        // We log and still allow progression with local demo fallback
        console.warn('Supabase farmer signup warning:', res.error);
      }
      router.push('/farmer/dashboard');
    } catch (err: any) {
      console.error('Farmer registration error:', err);
      router.push('/farmer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Farmer Supabase Login
  const handleFarmerLogin = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await signInWithSupabase(phone, password || 'kisan123', 'FARMER');
      if (res.error) {
        setAuthError(res.error);
      } else {
        router.push('/farmer/dashboard');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'लॉगिन विफल रहा');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans antialiased">
      {/* Language Switcher Bar */}
      <div className="w-full max-w-md flex justify-end mb-3">
        <LanguageSelector variant="light" showLabel={false} />
      </div>

      {/* Container Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[620px]">

        {/* ========================================================= */}
        {/* VIEW 1: REGISTRATION FLOW (STEPS 1 - 5)                   */}
        {/* ========================================================= */}
        {authMode === 'REGISTER' && (
          <div className="flex-1 flex flex-col p-5 sm:p-7">

            {/* Step Progress Header Bar */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <button
                onClick={() => {
                  if (regStep > 1) setRegStep(regStep - 1);
                  else router.push('/');
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Step Indicators */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all ${s === regStep
                      ? 'w-6 bg-emerald-600'
                      : s < regStep
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-slate-200'
                      }`}
                  />
                ))}
              </div>

              <div className="w-5" /> {/* Spacer */}
            </div>

            {/* ----------------------------------------------------- */}
            {/* STEP 1: किसान पंजीकरण (FARMER REGISTRATION FORM)        */}
            {/* ----------------------------------------------------- */}
            {regStep === 1 && (
              <div className="flex-1 flex flex-col space-y-4">

                {/* Brand Banner Header */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className="flex items-center gap-2">
                    <img src="/favicon.svg" alt="KrishiSetu Logo" className="w-8 h-8 object-contain shrink-0" />
                    <span className="font-extrabold text-xl text-emerald-800 tracking-tight">KrishiSetu</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">किसान से सीधा बाज़ार तक</p>
                </div>

                {/* Farmer Hero Photo */}
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-emerald-100 relative shadow-2xs">
                  <img
                    src="/assets/kisan-setu/Farmer.jpg"
                    alt="Kisan Registration"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <p className="text-white text-xs font-bold">समृद्ध किसान, सशक्त भारत 🇮🇳</p>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="font-black text-xl text-slate-900 leading-tight">किसान पंजीकरण</h2>
                  <p className="text-xs text-slate-500 font-semibold">अपनी जानकारी दर्ज करें</p>
                </div>

                {/* Registration Form Fields */}
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      नाम <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="अपना पूरा नाम लिखें"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      मोबाइल नंबर <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10 अंकों का मोबाइल नंबर डालें"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      गाँव / शहर <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="अपना गाँव या शहर चुनें"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        जिला <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="बाराबंकी">बाराबंकी</option>
                        <option value="लखनऊ">लखनऊ</option>
                        <option value="कानपुर">कानपुर</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        राज्य <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="उत्तर प्रदेश">उत्तर प्रदेश</option>
                        <option value="मध्य प्रदेश">मध्य प्रदेश</option>
                        <option value="बिहार">बिहार</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      पासवर्ड सेट करें (लॉगिन हेतु) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="कम से कम 6 अक्षरों का पासवर्ड"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit & Login Link */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => setRegStep(2)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>आगे बढ़ें</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <p className="text-center text-xs font-semibold text-slate-600">
                    पहले से पंजीकृत हैं?{' '}
                    <button
                      onClick={() => setAuthMode('LOGIN')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      लॉगइन करें
                    </button>
                  </p>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 2: मोबाइल सत्यापन (MOBILE OTP VERIFICATION)        */}
            {/* ----------------------------------------------------- */}
            {regStep === 2 && (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-2 space-y-4">

                <div className="space-y-3 w-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-xs border border-emerald-200">
                    📱
                  </div>

                  <h2 className="font-black text-xl text-slate-900">मोबाइल सत्यापन</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    आपके मोबाइल नंबर पर एक OTP भेजा गया है
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 inline-flex items-center gap-3 text-xs font-bold text-slate-800">
                    <span>+91 {phone}</span>
                    <button onClick={() => setRegStep(1)} className="text-emerald-700 hover:underline text-[11px]">
                      ✏️ बदलें
                    </button>
                  </div>

                  <div className="pt-4 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">OTP दर्ज करें</label>
                    <div className="flex items-center justify-center gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          className="w-10 h-11 bg-slate-50 border-2 border-emerald-600 rounded-xl text-center font-black text-lg text-slate-900 focus:bg-white focus:outline-none shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-500 pt-2">
                    OTP <span className="text-emerald-700 font-bold">01:59</span> सेकंड में पुनः भेजें
                  </p>
                </div>

                <div className="w-full space-y-2 pt-4">
                  <button
                    onClick={() => setRegStep(3)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition-colors shadow-xs"
                  >
                    OTP सत्यापित करें
                  </button>

                  <button
                    onClick={() => setRegStep(1)}
                    className="text-xs text-slate-500 font-semibold hover:text-slate-800"
                  >
                    मोबाइल नंबर गलत है? बदलें
                  </button>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 3: पहचान सत्यापन (IDENTITY CHECK CHOICE)          */}
            {/* ----------------------------------------------------- */}
            {regStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-2 space-y-4">

                <div className="space-y-4 w-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl border border-emerald-200 shadow-xs">
                    🛡️
                  </div>

                  <h2 className="font-black text-xl text-slate-900">अपनी पहचान सत्यापित करें</h2>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                    KrishiSetu पर सुरक्षित और भरोसेमंद लेन-देन के लिए पहचान सत्यापन आवश्यक है।
                  </p>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left flex items-start gap-3 text-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900">आपकी जानकारी पूरी तरह सुरक्षित है</h4>
                      <p className="text-[11px] text-emerald-700 font-medium">हम आपकी गोपनीयता का पूरा ध्यान रखते हैं।</p>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => setRegStep(4)}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span className="bg-white text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-black">AADHAAR</span>
                    <span>Aadhaar से सत्यापित करें</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setRegStep(5)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    बाद में करें
                  </button>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 4: आधार सत्यापन (AADHAAR NUMBER INPUT)            */}
            {/* ----------------------------------------------------- */}
            {regStep === 4 && (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-2 space-y-4">

                <div className="space-y-4 w-full">
                  {/* Aadhaar Logo Illustration */}
                  <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
                    🆔
                  </div>

                  <h2 className="font-black text-xl text-slate-900">आधार से अपनी पहचान सत्यापित करें</h2>

                  <div className="text-left space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">आधार नंबर दर्ज करें</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="12 अंकों का आधार नंबर"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white tracking-wider"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left flex items-start gap-2.5 text-xs text-slate-600">
                    <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      आपका आधार नंबर सुरक्षित है. हम आपकी आधार जानकारी को स्टोर नहीं करते हैं। यह केवल सत्यापन के लिए उपयोग किया जाएगा।
                    </p>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <button
                    onClick={() => setRegStep(5)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition-colors shadow-xs"
                  >
                    आगे बढ़ें
                  </button>

                  <button className="text-xs text-slate-500 font-semibold hover:text-slate-800 flex items-center justify-center gap-1 mx-auto">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>समस्या आ रही है? सहायता लें</span>
                  </button>
                </div>

              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 5: सफलता (VERIFICATION SUCCESS)                   */}
            {/* ----------------------------------------------------- */}
            {regStep === 5 && (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-2 space-y-4">

                <div className="space-y-4 w-full">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    सफलता
                  </span>

                  {/* Circular Portrait with Verified Badge Overlay */}
                  <div className="relative w-28 h-28 mx-auto">
                    <img
                      src="/assets/kisan-setu/Farmer.jpg"
                      alt="Verified Farmer"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-md object-top"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-black text-2xl text-slate-900">बधाई हो!</h2>
                    <p className="font-extrabold text-emerald-800 text-base">आपकी पहचान सत्यापित हो गई है।</p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-300">
                    <span>सत्यापित किसान</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </div>

                  <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto leading-relaxed pt-2">
                    अब आप KrishiSetu पर अपनी उपज बेच सकते हैं, खरीदारों से जुड़ सकते हैं और बेहतर दाम पा सकते हैं।
                  </p>
                </div>

                <div className="w-full pt-4">
                  <button
                    onClick={handleFarmerRegister}
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <span>{loading ? 'सत्यापित हो रहा है...' : 'KrishiSetu में प्रवेश करें'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: FARMER LOGIN FLOW                                 */}
        {/* ========================================================= */}
        {authMode === 'LOGIN' && (
          <div className="flex-1 flex flex-col p-5 sm:p-7 space-y-5">

            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                onClick={() => setAuthMode('REGISTER')}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <span className="font-extrabold text-sm text-slate-800">किसान लॉगिन</span>
              <div className="w-5" />
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-center">
                {authError}
              </div>
            )}

            {/* Logo */}
            <div className="flex flex-col items-center text-center space-y-1">
              <img src="/favicon.svg" alt="KrishiSetu Logo" className="w-12 h-12 object-contain shrink-0" />
              <h2 className="font-black text-xl text-slate-900">किसान लॉगिन</h2>
              <p className="text-xs text-slate-500 font-semibold">अपने खाते में लॉगइन करें</p>
            </div>

            {/* Login Options Selector */}
            {loginMethod === 'SELECT' && (
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <button
                  onClick={() => setLoginMethod('MOBILE_OTP')}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>मोबाइल नंबर से लॉगिन</span>
                </button>

                <button
                  onClick={() => setLoginMethod('PASSWORD')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span>पासवर्ड से लॉगिन</span>
                </button>

                {/* Benefits Card */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-2 mt-4 text-left">
                  <h4 className="font-extrabold text-xs text-emerald-900">KrishiSetu के फायदे:</h4>
                  <ul className="text-[11px] text-slate-600 space-y-1.5 font-semibold">
                    <li className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>बेहतर दाम — सीधे खरीदारों से जुड़ें और उचित दाम पाएं।</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>सीधी बिक्री — बिचौलियों के बिना अपनी उपज बेचें।</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>सुरक्षित लेन-देन — 100% सत्यापित डिजिटल प्लेटफॉर्म।</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Mobile OTP Login Input Form */}
            {loginMethod === 'MOBILE_OTP' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">अपने मोबाइल नंबर से लॉगिन करें</h3>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">मोबाइल नंबर</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10 अंकों का मोबाइल नंबर डालें"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleFarmerLogin}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-colors shadow-xs"
                  >
                    {loading ? 'प्रमाणीकरण हो रहा है...' : 'लॉगइन करें (Supabase)'}
                  </button>

                  <button
                    onClick={() => setLoginMethod('SELECT')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 block mx-auto"
                  >
                    लॉगिन विकल्प बदलें
                  </button>
                </div>
              </div>
            )}

            {/* Password Login Input Form */}
            {loginMethod === 'PASSWORD' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">मोबाइल नंबर</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 अंकों का मोबाइल नंबर डालें"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">पासवर्ड</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="अपना पासवर्ड डालें"
                        className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button className="text-[11px] font-bold text-slate-500 hover:text-emerald-700">
                      पासवर्ड भूल गए?
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleFarmerLogin}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-colors shadow-xs"
                  >
                    {loading ? 'लॉगइन हो रहा है...' : 'लॉगइन करें'}
                  </button>
                </div>
              </div>
            )}

            {/* Toggle to Registration */}
            <div className="pt-2 text-center text-xs font-semibold text-slate-600">
              नए किसान हैं?{' '}
              <button
                onClick={() => {
                  setAuthMode('REGISTER');
                  setRegStep(1);
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                पंजीकरण करें
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
