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
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { directPhoneAuth } from '@/lib/firebase/authClient';
import { useFarmerStore } from '@/lib/store/farmerStore';

export default function FarmerAuthPage() {
  const router = useRouter();
  const { updateUserProfile } = useFarmerStore();

  // Mode: 'LOGIN' | 'REGISTER'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Registration Steps: 1 (Personal & Phone) -> 2 (Location & Aadhaar) -> 3 (Success)
  const [regStep, setRegStep] = useState<number>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('बाराबंकी');
  const [state, setState] = useState('उत्तर प्रदेश');
  const [aadhaarNumber, setAadhaarNumber] = useState('');

  // Async & UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Handle Step 1 of Registration -> Validate Name & Phone
  const handleRegStep1Next = () => {
    if (!fullName.trim()) {
      setErrorMsg('कृपया अपना पूरा नाम दर्ज करें');
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें');
      return;
    }

    setErrorMsg('');
    setInfoMsg('');
    setRegStep(2);
  };

  // Handle Step 2 -> Direct Registration (Zero OTP)
  const handleRegisterSubmit = async () => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें');
      return;
    }

    const cleanedAadhaar = aadhaarNumber.replace(/\D/g, '');
    const last4 = cleanedAadhaar.length >= 4 ? cleanedAadhaar.slice(-4) : '';

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await directPhoneAuth({
        phone: cleanedPhone,
        fullName: fullName.trim() || 'किसान साथी',
        role: 'FARMER',
        village: village.trim() || 'ग्राम बहरामघाट',
        district: district.trim() || 'बाराबंकी',
        state: state.trim() || 'उत्तर प्रदेश',
        aadhaarLast4: last4,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'पंजीकरण में समस्या आई। कृपया पुनः प्रयास करें।');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('krishi_active_role', 'FARMER');
      }

      updateUserProfile({
        fullName: fullName.trim() || 'किसान साथी',
        phone: cleanedPhone,
        village: village.trim() || 'ग्राम बहरामघाट',
        district: district.trim() || 'बाराबंकी',
        state: state.trim() || 'उत्तर प्रदेश',
        aadhaarLast4: last4 || '1234',
        verificationStatus: last4 ? 'VERIFIED' : 'PENDING',
      });

      setRegStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'पंजीकरण में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  // Direct Mobile Login (Zero OTP)
  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await directPhoneAuth({
        phone: cleanedPhone,
        role: 'FARMER',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'लॉगिन विफल रहा। कृपया पुनः प्रयास करें।');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('krishi_active_role', 'FARMER');
      }

      updateUserProfile({
        phone: cleanedPhone,
        fullName: res.user?.full_name || 'रामेश्वर सिंह',
      });

      router.push('/farmer/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'लॉगिन में समस्या आई।');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Demo Farmer Login
  const handleQuickDemoLogin = async () => {
    setPhone('9876543210');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await directPhoneAuth({
        phone: '9876543210',
        fullName: 'रामेश्वर सिंह',
        role: 'FARMER',
        village: 'ग्राम बहरामघाट',
        district: 'बाराबंकी',
        state: 'उत्तर प्रदेश',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('krishi_active_role', 'FARMER');
      }

      updateUserProfile({
        phone: '9876543210',
        fullName: 'रामेश्वर सिंह',
        village: 'ग्राम बहरामघाट',
        district: 'बाराबंकी',
        state: 'उत्तर प्रदेश',
        verificationStatus: 'VERIFIED',
      });

      router.push('/farmer/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'डेमो लॉगिन में समस्या आई।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans antialiased relative">
      {/* Main Container Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px]">
        {/* Top Header Mode Toggle (लॉगिन / नया पंजीकरण) */}
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs font-extrabold">
          <button
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'LOGIN'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>👤</span>
            <span>किसान लॉगिन</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('REGISTER');
              setRegStep(1);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'REGISTER'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📝</span>
            <span>नया पंजीकरण</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: FARMER DIRECT LOGIN (ZERO OTP)                    */}
        {/* ========================================================= */}
        {authMode === 'LOGIN' && (
          <div className="flex-1 flex flex-col p-5 sm:p-7 justify-between space-y-4">
            <div className="space-y-4">
              {/* Back to Home Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push('/')}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>मुख्य पृष्ठ</span>
                </button>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  सीधा लॉगिन (No OTP)
                </span>
              </div>

              {/* Logo & Headline */}
              <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm border-2 border-emerald-600">
                  🌿
                </div>
                <h1 className="font-black text-2xl text-slate-900 tracking-tight">किसान लॉगिन</h1>
                <p className="text-xs text-slate-500 font-semibold max-w-xs">
                  अपने 10 अंकों के मोबाइल नंबर से सीधे डैशबोर्ड में प्रवेश करें
                </p>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Direct Login Form */}
              <form onSubmit={handleDirectLogin} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    मोबाइल नंबर <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 flex items-center gap-1 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10 अंकों का नंबर डालें (उदा: 9876543210)"
                      className="w-full pl-20 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white tracking-wider"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    OTP की आवश्यकता नहीं है। सीधे लॉगिन करें।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>डैशबोर्ड में प्रवेश करें</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick 1-Click Demo Login */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    या 1-क्लिक डेमो
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>रामेश्वर सिंह (डेमो किसान) के रूप में तुरंत प्रवेश करें</span>
                </button>
              </div>
            </div>

            {/* Benefits & Registration Link */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
              <p className="text-xs font-semibold text-slate-600">
                क्या आप नए किसान हैं?{' '}
                <button
                  onClick={() => {
                    setAuthMode('REGISTER');
                    setRegStep(1);
                    setErrorMsg('');
                  }}
                  className="text-emerald-700 font-extrabold hover:underline"
                >
                  यहाँ नया पंजीकरण करें
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGISTRATION FLOW (3 CLEAN STEPS, ZERO OTP)        */}
        {/* ========================================================= */}
        {authMode === 'REGISTER' && (
          <div className="flex-1 flex flex-col p-5 sm:p-7 justify-between">
            {/* Step Progress Indicator Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <button
                onClick={() => {
                  if (regStep > 1) setRegStep(regStep - 1);
                  else setAuthMode('LOGIN');
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                title="पीछे जाएं"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all ${
                      s === regStep
                        ? 'w-7 bg-emerald-600'
                        : s < regStep
                        ? 'w-2.5 bg-emerald-500'
                        : 'w-2.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-extrabold text-slate-400">चरण {regStep}/3</span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 1: व्यक्तिगत विवरण (NAME & PHONE)                 */}
            {/* ----------------------------------------------------- */}
            {regStep === 1 && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="font-black text-xl text-slate-900">किसान पंजीकरण</h2>
                    <p className="text-xs text-slate-500 font-semibold">अपना नाम और मोबाइल नंबर दर्ज करें</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        पूरा नाम <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="अपना पूरा नाम लिखें (उदा: रामेश्वर सिंह)"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        मोबाइल नंबर <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 flex items-center gap-1 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2">
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10 अंकों का मोबाइल नंबर डालें"
                          className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    onClick={handleRegStep1Next}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span>आगे बढ़ें (स्थान विवरण)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <p className="text-center text-xs font-semibold text-slate-500">
                    पहले से खाता है?{' '}
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
            {/* STEP 2: खेत व स्थान विवरण (LOCATION & AADHAAR)         */}
            {/* ----------------------------------------------------- */}
            {regStep === 2 && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="text-center space-y-1">
                    <h2 className="font-black text-xl text-slate-900">खेत व स्थान विवरण</h2>
                    <p className="text-xs text-slate-500 font-semibold">अपने गाँव व जिले की जानकारी दें</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        गाँव / कस्बा <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="अपना गाँव लिखें (उदा: ग्राम बहरामघाट)"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="बाराबंकी">बाराबंकी</option>
                          <option value="लखनऊ">लखनऊ</option>
                          <option value="अयोध्या">अयोध्या</option>
                          <option value="सीतापुर">सीतापुर</option>
                          <option value="रायबरेली">रायबरेली</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          राज्य <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="उत्तर प्रदेश">उत्तर प्रदेश</option>
                          <option value="मध्य प्रदेश">मध्य प्रदेश</option>
                          <option value="बिहार">बिहार</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        आधार नंबर (वैकल्पिक / Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={12}
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="12 अंकों का आधार नंबर दर्ज करें"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white tracking-wider"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    onClick={handleRegisterSubmit}
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>पंजीकरण पूरा करें (बिना OTP)</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setRegStep(1)}
                    className="w-full py-2 text-xs text-slate-500 font-bold hover:text-slate-800"
                  >
                    पीछे जाएं
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* STEP 3: सफलता व स्वागत (SUCCESS & ENTER)              */}
            {/* ----------------------------------------------------- */}
            {regStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-2 space-y-4">
                <div className="space-y-4 w-full">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                    🎉 पंजीकरण सफल!
                  </span>

                  {/* Circular Portrait with Verified Badge */}
                  <div className="relative w-28 h-28 mx-auto">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300"
                      alt="Verified Farmer"
                      className="w-full h-full rounded-full object-cover border-4 border-emerald-500 shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-black text-2xl text-slate-900">
                      बधाई हो, {fullName || 'किसान साथी'} जी!
                    </h2>
                    <p className="font-bold text-emerald-800 text-sm">
                      आपका KrishiSetu किसान खाता सक्रिय हो गया है।
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>सत्यापित किसान प्रोफाइल 🇮🇳</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto leading-relaxed pt-1">
                    अब आप अपनी उपज सीधे खरीदारों को बेच सकते हैं और बिना किसी बिचौलिए के सही दाम पा सकते हैं।
                  </p>
                </div>

                <div className="w-full pt-4">
                  <button
                    onClick={() => router.push('/farmer/dashboard')}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <span>KrishiSetu डैशबोर्ड में प्रवेश करें</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
