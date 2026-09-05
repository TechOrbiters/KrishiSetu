'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Mic,
  Camera,
  MapPin,
  Edit2,
  Eye,
  PlusCircle,
  Truck,
  User,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams ? searchParams.get('mode') : null;
  const { addListing, user } = useFarmerStore();

  const [step, setStep] = useState<number>(1); // 1, 2, 3, 4 (Preview), 5 (Success)
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(initialMode === 'voice');

  // Form Fields
  const [cropName, setCropName] = useState<string>('टमाटर');
  const [cropCategory, setCropCategory] = useState<string>('सब्जी');
  const [quantity, setQuantity] = useState<number>(200);
  const [minOrder, setMinOrder] = useState<number>(20);
  const [price, setPrice] = useState<number>(24);
  const [quality, setQuality] = useState<'सामान्य' | 'अच्छी' | 'प्रीमियम'>('अच्छी');
  const [readyWhen, setReadyWhen] = useState<string>('अभी तैयार है');
  const [deliveryMethod, setDeliveryMethod] = useState<'SELF_PICKUP' | 'DELIVERY_REQUIRED'>('DELIVERY_REQUIRED');

  const handleFinalSubmit = () => {
    addListing({
      cropNameHindi: cropName,
      cropNameEnglish: 'Tomato',
      category: cropCategory,
      quantityKg: Number(quantity),
      availableQtyKg: Number(quantity),
      minOrderQtyKg: Number(minOrder),
      unit: 'kg',
      grade: quality === 'प्रीमियम' ? 'A' : quality === 'अच्छी' ? 'B' : 'C',
      askingPricePerKg: Number(price),
      marketPriceRange: '₹20 - ₹24 / kg',
      freshnessWindowHours: 24,
      harvestDate: new Date().toISOString(),
      locationVillage: user.village || 'बैजनाथपुर',
      locationDistrict: user.district || 'बाराबंकी',
      locationState: user.state || 'उत्तर प्रदेश',
      availability: 'TODAY',
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    });

    setStep(5); // Success Screen
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">
              {step === 4 ? 'पूर्वावलोकन' : step === 5 ? 'उपज लिस्ट हो गई!' : 'नई उपज लिस्ट करें'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {step === 4 ? 'खरीदार को आपकी उपज कुछ इस तरह दिखेगी' : 'अपनी उपज की जानकारी दें'}
            </p>
          </div>
        </div>

        {step <= 3 && (
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
            {step}/3
          </span>
        )}
        {step === 4 && <Eye className="w-5 h-5 text-emerald-700" />}
      </div>

      {/* 3 Step Indicator Bar */}
      {step <= 3 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-around text-xs font-bold shadow-2xs">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-700 font-extrabold' : step > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>जानकारी</span>
          </div>

          <div className="h-0.5 w-8 bg-slate-200" />

          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-700 font-extrabold' : step > 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>कीमत</span>
          </div>

          <div className="h-0.5 w-8 bg-slate-200" />

          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>
              3
            </span>
            <span>स्थान</span>
          </div>
        </div>
      )}

      {/* Voice Mode Toggle Bar */}
      {step <= 3 && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isVoiceMode ? 'सामान्य इनपुट मोड' : '🎤 बोलकर भरें मोड'}</span>
          </button>
        </div>
      )}

      {/* STEP 1: 1. उपज की जानकारी */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
            1. उपज की जानकारी
          </h2>

          <div className="space-y-4 text-xs">
            {/* Field 1: Crop Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">उपज का नाम*</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="जैसे - गेहूँ, आलू, टमाटर"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
                <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5 cursor-pointer" />
              </div>
              {isVoiceMode && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <span>आप बोल रहे हैं...</span>
                  <span className="font-bold">|||||</span>
                </div>
              )}
            </div>

            {/* Quick Choice Chips */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">या चुनें</span>
              {['🌾 गेहूँ', '🥔 आलू', '🍅 टमाटर', 'अन्य'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setCropName(chip.split(' ')[1] || chip)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-xl font-semibold transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Field 2: Crop Category */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">उपज की श्रेणी*</label>
              <div className="relative">
                <select
                  value={cropCategory}
                  onChange={(e) => setCropCategory(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="सब्जी">सब्जी (Vegetable)</option>
                  <option value="अनाज">अनाज (Grain)</option>
                  <option value="फल">फल (Fruit)</option>
                  <option value="दालें">दालें (Pulses)</option>
                </select>
                <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Field 3: Available Quantity */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">उपलब्ध मात्रा*</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="जैसे - 200"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5" />
                </div>
                <select className="p-3 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50">
                  <option>kg ▾</option>
                  <option>क्विंटल ▾</option>
                </select>
              </div>
            </div>

            {/* Field 4: Minimum Order Quantity */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">न्यूनतम ऑर्डर मात्रा*</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="जैसे - 20"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5" />
                </div>
                <select className="p-3 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50">
                  <option>kg ▾</option>
                </select>
              </div>
            </div>

            {/* Yellow Tip Note */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
              <span>💡</span>
              <span>न्यूनतम ऑर्डर मात्रा से कम का ऑर्डर नहीं किया जा सकेगा।</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
          >
            आगे बढ़ें →
          </button>
        </div>
      )}

      {/* STEP 2: 2. कीमत और बिक्री की जानकारी */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
            2. कीमत और बिक्री की जानकारी
          </h2>

          <div className="space-y-4 text-xs">
            {/* Field 1: Asking Price */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">कीमत*</label>
              <div className="flex items-center gap-2">
                <span className="p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold">₹</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="जैसे - 24"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                  <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5" />
                </div>
                <span className="font-bold text-slate-600">प्रति kg</span>
              </div>
            </div>

            {/* Green Today Market Price Banner */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>📈</span>
              <span>आज का बाजार भाव: ₹20 - ₹24 / kg</span>
            </div>

            {/* Quality Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">फसल की गुणवत्ता</label>
              <div className="grid grid-cols-3 gap-3">
                {(['सामान्य', 'अच्छी', 'प्रीमियम'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                      quality === q
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Ready Status Dropdown */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">फसल कब तैयार है?</label>
              <div className="relative">
                <select
                  value={readyWhen}
                  onChange={(e) => setReadyWhen(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="अभी तैयार है">अभी तैयार है (कटाई हो चुकी है)</option>
                  <option value="2 दिनों में">2 दिनों में तैयार होगी</option>
                  <option value="अगले हफ्ते">अगले हफ्ते तैयार होगी</option>
                </select>
                <Mic className="w-4 h-4 text-emerald-700 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Photo Upload Box */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">फसल की फोटो (वैकल्पिक)</label>
              <div className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center space-y-2 hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-xs text-slate-700">फोटो जोड़ें</p>
                <p className="text-[11px] text-slate-400">गैलरी से चुनें या कैमरा खोलें</p>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                🌱 अच्छी फोटो से आपकी उपज जल्दी बिकेगी।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-1/3 bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50"
            >
              ← वापस
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-2/3 bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
            >
              आगे बढ़ें →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 3. स्थान और डिलीवरी */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
            3. स्थान और डिलीवरी
          </h2>

          <div className="space-y-4 text-xs">
            {/* Location Display */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">उठाने का स्थान (आपका स्थान)</label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">गाँव: {user.village}</h4>
                    <p className="text-[11px] text-slate-500">जिला: {user.district}, {user.state}</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>बदलें</span>
                </button>
              </div>
            </div>

            {/* Selling Delivery Method Choice */}
            <div className="space-y-2 pt-2">
              <label className="font-bold text-slate-800 block">आपकी बिक्री का तरीका</label>

              {/* Choice A: Self Pickup */}
              <div
                onClick={() => setDeliveryMethod('SELF_PICKUP')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  deliveryMethod === 'SELF_PICKUP'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === 'SELF_PICKUP'}
                  onChange={() => {}}
                  className="mt-1 accent-emerald-600"
                />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600" />
                    <span>खरीदार खुद लेने आएगा</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    खरीदार आपके स्थान पर आकर उपज ले जाएगा
                  </p>
                </div>
              </div>

              {/* Choice B: Delivery Required */}
              <div
                onClick={() => setDeliveryMethod('DELIVERY_REQUIRED')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  deliveryMethod === 'DELIVERY_REQUIRED'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === 'DELIVERY_REQUIRED'}
                  onChange={() => {}}
                  className="mt-1 accent-emerald-600"
                />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>डिलीवरी चाहिए</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    KisanSetu पास के परिवहनकर्ता ढूंढेगा और डिलीवरी कराएगा
                  </p>
                </div>
              </div>
            </div>

            {/* Green Protection Banner */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>सुरक्षित लेन-देन के लिए KisanSetu आपकी मदद करेगा।</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="w-1/3 bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50"
            >
              ← वापस
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-2/3 bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
            >
              पूर्वावलोकन देखें →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: पूर्वावलोकन (Preview Screen) */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600"
              alt="टमाटर"
              className="w-full h-56 object-cover"
            />
            <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-xs">
              अभी उपलब्ध
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-xl text-slate-900">{cropName}</h2>
            <span className="font-extrabold text-xl text-emerald-700">₹{price} / kg</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">📦 उपलब्ध मात्रा</span>
              <strong className="text-slate-900 font-bold">{quantity} kg</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">📦 न्यूनतम ऑर्डर</span>
              <strong className="text-slate-900 font-bold">{minOrder} kg</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">🌾 गुणवत्ता</span>
              <strong className="text-slate-900 font-bold">{quality}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">⏱️ उपलब्धता</span>
              <strong className="text-slate-900 font-bold">अभी</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">📍 स्थान</span>
              <strong className="text-slate-900 font-bold">{user.village}, {user.district}, {user.state}</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">🚚 डिलीवरी</span>
              <strong className="text-slate-900 font-bold">डिलीवरी उपलब्ध</strong>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>आपकी उपज का विवरण खरीदारों को दिखाई देगा।</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-1/2 bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              <span>जानकारी बदलें</span>
            </button>
            <button
              onClick={handleFinalSubmit}
              className="w-1/2 bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>उपज लिस्ट करें</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: सफलता स्क्रीन (Success Screen) */}
      {step === 5 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
          {/* Farmer Illustration Image */}
          <div className="w-40 h-40 rounded-full bg-emerald-50 p-2 mx-auto border-4 border-emerald-100 overflow-hidden shadow-inner">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300"
              alt="बधाई हो"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div>
            <span className="w-10 h-10 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center font-bold text-lg shadow-sm mb-2">
              ✓
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">बधाई हो!</h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              आपकी उपज सफलतापूर्वक लिस्ट हो गई है।
            </p>
          </div>

          {/* Listing Card Snippet */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4 text-left max-w-sm mx-auto text-xs">
            <img
              src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=150"
              alt="टमाटर"
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{cropName}</h4>
              <p className="text-slate-600 font-medium">{quantity} kg · ₹{price} / kg</p>
              <p className="text-[11px] text-slate-400 mt-0.5">📍 {user.village}, {user.district}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/farmer/listings"
              className="w-full bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl block text-center hover:bg-emerald-800 transition-colors shadow-xs"
            >
              मेरी लिस्टिंग देखें →
            </Link>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-50"
            >
              और उपज लिस्ट करें +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddNewProducePage() {
  return (
    <FarmerLayout>
      <Suspense fallback={<div className="text-center py-10 text-xs">लोड हो रहा है...</div>}>
        <WizardContent />
      </Suspense>
    </FarmerLayout>
  );
}
