'use client';

import React from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  User,
  MapPin,
  ShieldCheck,
  HelpCircle,
  PhoneCall,
  MessageSquare,
  FileText,
  Headphones,
  Settings,
  Globe,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, logout, updateUserProfile } = useFarmerStore();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/farmer');
  };

  const [isEditingPersonal, setIsEditingPersonal] = React.useState(false);
  const [isEditingLocation, setIsEditingLocation] = React.useState(false);
  const [personalForm, setPersonalForm] = React.useState({
    fullName: user.fullName || '',
    fatherOrSpouseName: user.fatherOrSpouseName || '',
    phone: user.phone || '',
    dob: user.dob || '',
    gender: user.gender || 'पुरुष',
  });
  const [locationForm, setLocationForm] = React.useState({
    village: user.village || '',
    postOffice: user.postOffice || '',
    district: user.district || '',
    state: user.state || '',
    pincode: user.pincode || '',
  });
  const [saveSuccess, setSaveSuccess] = React.useState('');

  React.useEffect(() => {
    setPersonalForm({
      fullName: user.fullName || '',
      fatherOrSpouseName: user.fatherOrSpouseName || '',
      phone: user.phone || '',
      dob: user.dob || '',
      gender: user.gender || 'पुरुष',
    });
    setLocationForm({
      village: user.village || '',
      postOffice: user.postOffice || '',
      district: user.district || '',
      state: user.state || '',
      pincode: user.pincode || '',
    });
  }, [user]);

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(personalForm);
    setIsEditingPersonal(false);
    setSaveSuccess('व्यक्तिगत जानकारी सफलतापूर्वक अपडेट की गई!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(locationForm);
    setIsEditingLocation(false);
    setSaveSuccess('स्थान विवरण सफलतापूर्वक अपडेट किया गया!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Profile Hero Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with Camera Icon */}
            <div className="relative">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300"}
                alt={user.fullName || 'किसान प्रोफाइल'}
                className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-sm"
              />
              <button 
                title="फोटो बदलें"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-emerald-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Basic Information */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900">{user.fullName || 'किसान साथी'}</h2>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {user.verificationStatus === 'VERIFIED' ? 'सत्यापित किसान' : 'सत्यापन प्रक्रियाधीन'}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-600 text-sm font-semibold">
                <span>📞</span>
                <span>+91 {user.phone || '9876543210'}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-500 text-xs font-medium">
                <span>📍</span>
                <span>{user.village || 'ग्राम बहरामघाट'}, {user.district || 'बाराबंकी'}, {user.state || 'उत्तर प्रदेश'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट करें</span>
          </button>
        </div>

        {/* Tab Navigation Line */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6 text-sm font-bold">
            <button className="text-emerald-700 border-b-2 border-emerald-600 pb-2 px-1">
              व्यक्तिगत जानकारी एवं सेटिंग्स
            </button>
          </div>
        </div>

        {/* 2 Side-by-Side Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: व्यक्तिगत जानकारी */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <User className="w-4 h-4 text-emerald-700" />
                <span>व्यक्तिगत जानकारी</span>
              </div>
              <button 
                onClick={() => setIsEditingPersonal(true)}
                className="text-xs font-bold text-emerald-700 hover:underline">
                संपादित करें
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">पूरा नाम</span>
                <strong className="text-slate-900 font-semibold">{user.fullName || 'किसान साथी'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">पिता / पति का नाम</span>
                <strong className="text-slate-900 font-semibold">{user.fatherOrSpouseName || 'श्याम लाल'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">मोबाइल नंबर</span>
                <strong className="text-slate-900 font-semibold">+91 {user.phone || '9876543210'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1 pt-2">
                <span className="text-slate-500 font-medium">जन्म तिथि</span>
                <strong className="text-slate-900 font-semibold">{user.dob || '15/06/1985'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">लिंग</span>
                <strong className="text-slate-900 font-semibold">{user.gender || 'पुरुष'}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: स्थान विवरण */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>स्थान विवरण</span>
              </div>
              <button 
                onClick={() => setIsEditingLocation(true)}
                className="text-xs font-bold text-emerald-700 hover:underline">
                संपादित करें
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">गाँव / शहर</span>
                <strong className="text-slate-900 font-semibold">{user.village || 'बैजनापुर'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">पोस्ट ऑफिस</span>
                <strong className="text-slate-900 font-semibold">{user.postOffice || 'बैजनापुर'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">जिला</span>
                <strong className="text-slate-900 font-semibold">{user.district || 'बाराबंकी'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">राज्य</span>
                <strong className="text-slate-900 font-semibold">{user.state || 'उत्तर प्रदेश'}</strong>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-slate-500 font-medium">पिन कोड</span>
                <strong className="text-slate-900 font-semibold">{user.pincode || '221204'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Edit Personal Info */}
        {isEditingPersonal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">व्यक्तिगत जानकारी संपादित करें</h3>
              <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पूरा नाम</label>
                  <input
                    type="text"
                    required
                    value={personalForm.fullName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पिता / पति का नाम</label>
                  <input
                    type="text"
                    value={personalForm.fatherOrSpouseName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fatherOrSpouseName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">मोबाइल नंबर</label>
                  <input
                    type="tel"
                    required
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">जन्म तिथि</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={personalForm.dob}
                      onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">लिंग</label>
                    <select
                      value={personalForm.gender}
                      onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="पुरुष">पुरुष</option>
                      <option value="महिला">महिला</option>
                      <option value="अन्य">अन्य</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                  >
                    सहेजें (Save)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Location Info */}
        {isEditingLocation && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">स्थान विवरण संपादित करें</h3>
              <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">गाँव / शहर</label>
                  <input
                    type="text"
                    required
                    value={locationForm.village}
                    onChange={(e) => setLocationForm({ ...locationForm, village: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पोस्ट ऑफिस</label>
                  <input
                    type="text"
                    value={locationForm.postOffice}
                    onChange={(e) => setLocationForm({ ...locationForm, postOffice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">जिला</label>
                    <input
                      type="text"
                      required
                      value={locationForm.district}
                      onChange={(e) => setLocationForm({ ...locationForm, district: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">राज्य</label>
                    <input
                      type="text"
                      required
                      value={locationForm.state}
                      onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पिन कोड</label>
                  <input
                    type="text"
                    required
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                  >
                    सहेजें (Save)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Card 3: पहचान सत्यापन */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>पहचान सत्यापन</span>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white p-2 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <div className="text-center font-bold text-amber-600 text-xs leading-none">
                  ☀️<br /><span className="text-[8px] text-red-600">AADHAAR</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-emerald-900 text-sm">Aadhaar से सत्यापित</h4>
                <p className="text-xs text-slate-500 font-medium">Aadhaar नंबर</p>
                <p className="font-bold text-slate-900 text-sm tracking-wider">XXXX XXXX 1234</p>
                <p className="text-[11px] text-slate-500">सत्यापित दिनांक: 20 मई 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md">
                सत्यापित
              </span>
              <ChevronRight className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 4: HELP CENTER & CUSTOMER SUPPORT (सहायता केंद्र)    */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-extrabold text-base text-slate-900">
              <Headphones className="w-5 h-5 text-emerald-700" />
              <span>सहायता केंद्र एवं सेटिंग्स (Help & Support Settings)</span>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
              24x7 उपलब्ध
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            किसी भी सहायता, शिकायत या समस्या के लिए हमारी सपोर्ट टीम से संपर्क करें:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">

            {/* Toll-Free Call Support */}
            <a
              href="tel:18001234567"
              className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-2xl border border-emerald-200/80 transition-all flex items-center gap-3.5 group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">टोल फ्री हेल्पलाइन</span>
                <span className="text-xs font-black text-emerald-800">1800-123-4567</span>
              </div>
            </a>

            {/* AI Assistant Chat */}
            <Link
              href="/farmer/ai-assistant"
              className="p-4 bg-purple-50/70 hover:bg-purple-100/70 rounded-2xl border border-purple-200/80 transition-all flex items-center gap-3.5 group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">कृषि मित्र AI असिस्टेंट</span>
                <span className="text-[11px] text-purple-700 font-semibold">तुरंत लाइव चैट करें</span>
              </div>
            </Link>

            {/* Help FAQs Page */}
            <Link
              href="/farmer/help"
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition-all flex items-center gap-3.5 group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">अक्सर पूछे जाने वाले प्रश्न</span>
                <span className="text-[11px] text-slate-500 font-medium">FAQ & गाइड देखें</span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </FarmerLayout>
  );
}
