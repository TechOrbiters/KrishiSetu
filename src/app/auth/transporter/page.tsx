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
  Truck,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CreditCard,
  FileText,
  Navigation,
  Sparkles,
} from 'lucide-react';
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  sendPasswordReset,
  UserProfileData,
} from '@/lib/firebase/authClient';

export default function TransporterAuthPage() {
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
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('PICKUP_1_5T');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [operatingDistrict, setOperatingDistrict] = useState('लखनऊ एवं बाराबंकी');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Handle Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('कृपया ईमेल और पासवर्ड दोनों दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithEmailPassword(email, password, 'TRANSPORTER');
      if (res.success) {
        setSuccessMsg('लॉगिन सफल! ट्रांसपोर्टर पोर्टल लोड हो रहा है...');
        setTimeout(() => {
          router.push('/transporter');
        }, 500);
      } else {
        setError(res.error || 'लॉगिन विफल रहा। कृपया क्रेडेंशियल पुनः जांचें।');
      }
    } catch (err: any) {
      setError(err.message || 'लॉगिन में त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Transporter Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('कृपया चालक/मालिक का पूरा नाम दर्ज करें');
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
    if (!vehicleNumber.trim()) {
      setError('कृपया वाहन पंजीकरण नंबर (गाड़ी नंबर) दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      const profile: UserProfileData = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+91 98765 43210',
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        operatingDistricts: operatingDistrict.trim(),
        role: 'TRANSPORTER',
      };

      const res = await registerWithEmailPassword(email, password, profile);
      if (res.success) {
        setSuccessMsg('पंजीकरण सफल! आपका वाहन नेटवर्क से जुड़ गया है...');
        setTimeout(() => {
          router.push('/transporter');
        }, 600);
      } else {
        setError(res.error || 'पंजीकरण विफल रहा');
      }
    } catch (err: any) {
      setError(err.message || 'पंजीकरण में त्रुटि आई');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Password Reset
  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('पासवर्ड रीसेट के लिए ईमेल पता दर्ज करें');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`पासवर्ड रीसेट लिंक ${email} पर प्रेषित किया गया है`);
      setTimeout(() => setMode('LOGIN'), 3000);
    } catch (err: any) {
      setError('पासवर्ड रीसेट लिंक भेजने में विफल');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fill
  const handleDemoFill = () => {
    setEmail('transporter.raj@krishisetu.in');
    setPassword('transport123');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center p-3 sm:p-6 font-sans select-none antialiased">
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-800 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>मुख्य पृष्ठ / Home</span>
        </Link>
        <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300/60 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-amber-700" />
          <span>कृषि परिवहन • Transporter Portal</span>
        </span>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col">
        {/* Visual Brand Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/25">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>फार्म-टू-मंडी डिलीवरी नेटवर्क • Zero Commission</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === 'REGISTER'
                ? 'वाहन पंजीकरण / Register Vehicle'
                : mode === 'FORGOT'
                ? 'पासवर्ड रीसेट / Reset Password'
                : 'ट्रांसपोर्टर लॉगिन / Partner Sign In'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 mt-1">
              प्रति-किलोमीटर निश्चित किराया, त्वरित एस्क्रो भुगतान और लाइव लोड आवंटन
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
                  ? 'bg-white text-amber-800 shadow-xs'
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
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              नया वाहन पंजीकरण (Register)
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
                  पंजीकृत ईमेल (Registered Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@transport.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-3 focus:ring-amber-100 transition-all"
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
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-3 focus:ring-amber-100 transition-all"
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
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">लॉगिन सत्र याद रखें</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                <span>ट्रांसपोर्टर पोर्टल में प्रवेश करें (Enter Portal)</span>
              </button>

              {/* Demo Account Fill */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">परीक्षण खाता (Demo Transporter):</p>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-700" />
                  <span>राजेश कुमार (राज ट्रांसपोर्ट • UP 32 AB 1234)</span>
                </button>
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
                    चालक / पार्टनर का नाम (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. राजेश कुमार"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाइल नंबर (Phone Number) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 12345"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
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
                    placeholder="driver@transport.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    वाहन का प्रकार (Vehicle Fleet Type) *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value="PICKUP_1_5T">पिकअप / छोटा हाथी (1.5 टन)</option>
                    <option value="MINI_TRUCK_3T">बोलेरो मैक्सी ट्रक (2.5 - 3 टन)</option>
                    <option value="MEDIUM_TRUCK_7T">आयशर 14 फीट (4 - 7 टन)</option>
                    <option value="REEFER_COLD">कोल्ड चेन / रीफर ट्रक (तापमान नियंत्रित)</option>
                    <option value="HEAVY_10T">भारी लॉरी (10+ टन)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    गाड़ी नंबर (Vehicle Registration) *
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="UP 32 AB 1234"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ड्राइविंग लाइसेंस नंबर (DL Number)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                      placeholder="DL-0420110012345"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    सक्रिय कार्यक्षेत्र (Base Districts)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={operatingDistrict}
                      onChange={(e) => setOperatingDistrict(e.target.value)}
                      placeholder="लखनऊ, बाराबंकी, सीतापुर"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                    />
                  </div>
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
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
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
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>वाहन जोड़ें और ट्रिप्स प्राप्त करें (Complete Partner Registration)</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* VIEW: FORGOT PASSWORD                                        */}
          {/* ============================================================ */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleForgotPass} className="space-y-4">
              <p className="text-xs text-slate-600">
                अपना पंजीकृत ईमेल पता दर्ज करें। हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे।
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
                    placeholder="driver@transport.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
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

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DoCA सरकार संरक्षित एस्क्रो</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>डिलीवरी पर तुरंत बैंक ट्रांसफर</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-amber-600" />
            <span>स्मार्ट रूट ऑप्टिमाइज़ेशन</span>
          </div>
        </div>
      </div>
    </div>
  );
}
