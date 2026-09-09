'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Layers,
} from 'lucide-react';
import {
  signInWithSupabase,
  signUpWithSupabase,
  resetPasswordSupabase,
  SupabaseUserProfile,
} from '@/lib/supabase/authClient';
import { LanguageSelector } from '@/components/common/LanguageSelector';

export default function BuyerAuthPage() {
  const router = useRouter();

  // 'LOGIN' | 'REGISTER' | 'FORGOT'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Form State - Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form State - Register
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [buyerType, setBuyerType] = useState<'RETAILER' | 'WHOLESALER' | 'INSTITUTIONAL' | 'HOUSEHOLD' | 'COMMISSION_AGENT'>('RETAILER');
  const [district, setDistrict] = useState('लखनऊ');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [gstin, setGstin] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 2. Handle Email/Password Login via Supabase Auth
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('कृपया ईमेल और पासवर्ड दोनों दर्ज करें (Please enter email & password)');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithSupabase(email, password, 'BUYER');
      if (res.success) {
        setSuccessMsg('लॉगिन सफल! किसान बाजार में स्वागत है...');
        setTimeout(() => router.push('/buyer'), 500);
      } else {
        setError(res.error || 'लॉगिन असफल हुआ। कृपया क्रेडेंशियल जांचें।');
      }
    } catch (err: any) {
      setError(err.message || 'लॉगिन में त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Registration via Supabase Auth & Users DB Sync
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('कृपया अपना पूरा नाम दर्ज करें');
      return;
    }
    if (!email || !password) {
      setError('ईमेल और पासवर्ड आवश्यक हैं');
      return;
    }
    if (password.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए');
      return;
    }

    setLoading(true);
    try {
      const profile: SupabaseUserProfile = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: regPhone.trim() || '+91 98765 00000',
        businessName: businessName.trim() || fullName.trim(),
        buyerType,
        district: district.trim(),
        address: deliveryAddress.trim() || 'नवीन गल्ला मंडी, लखनऊ',
        gstin: gstin.trim(),
        role: 'BUYER',
      };

      const res = await signUpWithSupabase(email, password, profile);
      if (res.success) {
        setSuccessMsg('पंजीकरण सफल! आपका Supabase क्रेता खाता सक्रिय हो गया है...');
        setTimeout(() => router.push('/buyer'), 600);
      } else {
        setError(res.error || 'पंजीकरण विफल रहा');
      }
    } catch (err: any) {
      setError(err.message || 'पंजीकरण में समस्या आई');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Password Reset
  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('पासवर्ड रीसेट लिंक के लिए ईमेल दर्ज करें');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordSupabase(email);
      setSuccessMsg(`पासवर्ड रीसेट ईमेल ${email} पर भेजा गया है`);
      setTimeout(() => setMode('LOGIN'), 3000);
    } catch (err: any) {
      setError('पासवर्ड रीसेट ईमेल भेजने में विफल');
    } finally {
      setLoading(false);
    }
  };

  // Demo Autofill for rapid evaluation
  const handleDemoFill = (type: 'WHOLESALE' | 'RETAIL') => {
    if (type === 'WHOLESALE') {
      setEmail('buyer.laxmi@krishisetu.in');
      setPassword('buyer123');
    } else {
      setEmail('rohit.traders@krishisetu.in');
      setPassword('buyer123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-3 sm:p-6 font-sans select-none antialiased">
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>मुख्य पृष्ठ / Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="light" showLabel={false} />
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full hidden sm:flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>किसान बाजार</span>
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col">
        {/* Visual Brand Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>सीधे खेत से थोक खरीद • Supabase Powered</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === 'REGISTER'
                ? 'क्रेता पंजीकरण / Buyer Registration'
                : mode === 'FORGOT'
                ? 'पासवर्ड रीसेट / Reset Password'
                : 'क्रेता लॉगिन / Buyer Sign In'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              0% कमीशन, सत्यापित FPO गुणवत्ता और सुरक्षित DoCA एस्क्रो भुगतान
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In / Register */}
        {mode !== 'FORGOT' && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200/80 text-center font-bold text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'LOGIN'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              साइन इन (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'REGISTER'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              नया पंजीकरण (New Register)
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}



          {/* ============================================================ */}
          {/* VIEW: LOGIN FORM                                             */}
          {/* ============================================================ */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ईमेल पता (Email Address)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">पासवर्ड (Password)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    पासवर्ड भूल गए?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">मुझे याद रखें</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                <span>क्रेता पोर्टल में प्रवेश करें (Sign In with Supabase)</span>
              </button>

              {/* Quick Demo Autofill */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">त्वरित परीक्षण खाता (Demo Accounts):</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoFill('WHOLESALE')}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors text-center"
                  >
                    🏢 थोक व्यापारी (Wholesaler)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoFill('RETAIL')}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors text-center"
                  >
                    🛒 सुपरमार्ट (Retail Mart)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* VIEW: REGISTRATION FORM                                      */}
          {/* ============================================================ */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पूरा नाम (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. रोहित वर्मा"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाइल नंबर (Mobile) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ईमेल पता (Email Address) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@mandi.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    फर्म / व्यापार का नाम (Business Name)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. लक्ष्मी एग्रो ट्रेडर्स"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    क्रेता श्रेणी (Buyer Category) *
                  </label>
                  <select
                    value={buyerType}
                    onChange={(e) => setBuyerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="RETAILER">खुदरा विक्रेता / Retailer</option>
                    <option value="WHOLESALER">थोक व्यापारी / Wholesaler</option>
                    <option value="INSTITUTIONAL">होटल / रेस्टोरेंट (HoReCa)</option>
                    <option value="COMMISSION_AGENT">मंडी कमीशन एजेंट / Agent</option>
                    <option value="HOUSEHOLD">उपभोक्ता / Household Direct</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  डिलीवरी पता / वेयरहाउस (Delivery Address)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="गोदाम / दुकान पता, मंडी परिसर"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पासवर्ड बनाएं (Create Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="न्यूनतम 6 अक्षर"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>क्रेता खाता बनाएं (Register in Supabase)</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* VIEW: FORGOT PASSWORD                                        */}
          {/* ============================================================ */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleForgotPass} className="space-y-4">
              <p className="text-xs text-slate-600">
                अपना पंजीकृत ईमेल पता दर्ज करें। हम आपको Supabase पासवर्ड रीसेट करने का लिंक भेजेंगे।
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  पंजीकृत ईमेल (Registered Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>रीसेट लिंक भेजें (Send Reset Link)</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← वापस लॉगिन पर जाएं (Back to Login)
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Guarantees */}
        <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DoCA सरकार Fair Trade सुरक्षित</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>GPS आधारित लाइव ट्रैकिंग</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>0% ब्रोकरेज शुल्क</span>
          </div>
        </div>
      </div>
    </div>
  );
}
