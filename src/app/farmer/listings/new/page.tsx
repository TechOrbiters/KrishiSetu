'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Mic,
  MicOff,
  Loader2,
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
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { createFarmerListing } from '@/lib/api/client';
import { useVoiceInput, VoiceInputResult } from '@/lib/hooks/useVoiceInput';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams ? searchParams.get('mode') : null;
  const fromAssistant = searchParams?.get('source') === 'assistant';
  const { addListing, user, refreshListings } = useFarmerStore();

  const [step, setStep] = useState<number>(1); // 1, 2, 3, 4 (Preview), 5 (Success)
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(initialMode === 'voice');
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  // Form Fields — pre-filled from AI assistant if source=assistant
  const [cropName, setCropName] = useState<string>(
    fromAssistant && searchParams ? (searchParams.get('crop') || '') : ''
  );
  const [cropCategory, setCropCategory] = useState<string>('सब्जी');
  const [quantity, setQuantity] = useState<number | string>(
    fromAssistant && searchParams ? (searchParams.get('quantity') || '') : ''
  );
  const [minOrder, setMinOrder] = useState<number | string>('');
  const [price, setPrice] = useState<number | string>(
    fromAssistant && searchParams ? (searchParams.get('price') || '') : ''
  );
  const [quality, setQuality] = useState<'सामान्य' | 'अच्छी' | 'प्रीमियम'>('अच्छी');
  const [readyWhen, setReadyWhen] = useState<string>('अभी तैयार है');
  const [deliveryMethod, setDeliveryMethod] = useState<'SELF_PICKUP' | 'DELIVERY_REQUIRED'>('DELIVERY_REQUIRED');
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  // Photo Upload State & Handlers
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFile = async (file: File) => {
    setImageUploadError(null);

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setImageUploadError('अमान्य फ़ाइल प्रकार। केवल JPG, PNG या WEBP फोटो चुनें (Only JPG, PNG or WEBP allowed).');
      return;
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setImageUploadError('फ़ाइल का आकार 5MB से अधिक है। कृपया 5MB से छोटी फ़ाइल चुनें (File exceeds 5MB).');
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setUploadedFileName(file.name);
    setUploadedFileSizeKb(Math.round(file.size / 1024));
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'फोटो अपलोड करने में विफल (Upload failed)');
      }

      setImageUrl(data.url);
      setImagePreview(data.url);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setImageUploadError(err.message || 'फोटो अपलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl('');
    setImagePreview('');
    setUploadedFileName('');
    setUploadedFileSizeKb(0);
    setImageUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to deduce category from crop name
  const deduceCategory = (crop: string) => {
    const c = crop.toLowerCase();
    if (c.includes('गेहूँ') || c.includes('चावल') || c.includes('धान') || c.includes('मक्का') || c.includes('wheat') || c.includes('rice') || c.includes('grain')) {
      return 'अनाज';
    }
    if (c.includes('चना') || c.includes('दाल') || c.includes('मटर') || c.includes('pulse')) {
      return 'दालें';
    }
    if (c.includes('सेब') || c.includes('आम') || c.includes('केला') || c.includes('fruit')) {
      return 'फल';
    }
    return 'सब्जी';
  };

  const {
    state: voiceState,
    isRecording,
    isProcessing,
    activeField,
    errorMessage: voiceError,
    recordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: clearVoiceError,
  } = useVoiceInput({
    onSuccess: (result: VoiceInputResult) => {
      const cleanText = result.transcript.replace(/[।.,?!]/g, '').trim();
      setVoiceToast(`पहचाना गया: "${cleanText}"`);
      setTimeout(() => setVoiceToast(null), 4000);

      if (result.field === 'cropName') {
        const detected = result.extractedIntent?.crop || cleanText;
        setCropName(detected);
        setCropCategory(deduceCategory(detected));
      } else if (result.field === 'quantity') {
        if (result.extractedIntent?.quantity) {
          setQuantity(result.extractedIntent.quantity);
        } else {
          const num = parseInt(cleanText.replace(/[^\d]/g, ''), 10);
          setQuantity(!isNaN(num) && num > 0 ? num : cleanText);
        }
      } else if (result.field === 'minOrder') {
        const num = parseInt(cleanText.replace(/[^\d]/g, ''), 10);
        setMinOrder(!isNaN(num) && num > 0 ? num : cleanText);
      } else if (result.field === 'price') {
        if (result.extractedIntent?.pricePerKg) {
          setPrice(result.extractedIntent.pricePerKg);
        } else {
          const num = parseInt(cleanText.replace(/[^\d]/g, ''), 10);
          setPrice(!isNaN(num) && num > 0 ? num : cleanText);
        }
      } else {
        // Global mode — extract all entities from full utterance
        if (result.extractedIntent?.crop) {
          setCropName(result.extractedIntent.crop);
          setCropCategory(deduceCategory(result.extractedIntent.crop));
        } else if (cleanText) {
          setCropName(cleanText);
        }

        if (result.extractedIntent?.quantity) {
          setQuantity(result.extractedIntent.quantity);
        }
        if (result.extractedIntent?.pricePerKg) {
          setPrice(result.extractedIntent.pricePerKg);
        }
      }
    },
  });

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setApiError(null);

    const numQty = Number(quantity);
    const numPrice = Number(price);

    if (!cropName || cropName.trim() === '') {
      setApiError('कृपया फसल का नाम दर्ज करें (Crop name is required)');
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      setApiError('कृपया वैध मात्रा दर्ज करें (Quantity must be greater than 0)');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setApiError('कृपया वैध मूल्य दर्ज करें (Price per kg must be greater than 0)');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        crop_name: cropName.trim(),
        category: cropCategory || 'Vegetables',
        quantity: numQty,
        price_per_kg: numPrice,
        grade: quality === 'प्रीमियम' ? 'A' : quality === 'अच्छी' ? 'B' : 'C',
        location_name: `${user.village || 'बैजनाथपुर'}, ${user.district || 'बाराबंकी'}`,
        harvest_date: new Date().toISOString().split('T')[0],
        shelf_life_days: 7,
        images: imageUrl ? [imageUrl] : [],
      };

      const res = await createFarmerListing(payload);

      if (!res.success || !res.data) {
        setApiError(res.error || 'सर्वर पर लिस्टिंग बनाने में विफल (Failed to create listing on server)');
        return;
      }

      const realListingId = res.data.id;
      setCreatedListingId(realListingId);

      // Synchronize local cache with real database ID
      addListing({
        id: realListingId,
        cropNameHindi: cropName,
        cropNameEnglish: cropName,
        category: cropCategory,
        quantityKg: numQty,
        availableQtyKg: numQty,
        minOrderQtyKg: Number(minOrder) || 10,
        unit: 'kg',
        grade: quality === 'प्रीमियम' ? 'A' : quality === 'अच्छी' ? 'B' : 'C',
        askingPricePerKg: numPrice,
        marketPriceRange: `₹${Math.max(1, numPrice - 2)} - ₹${numPrice + 2} / kg`,
        freshnessWindowHours: 24,
        harvestDate: new Date().toISOString(),
        locationVillage: user.village || 'बैजनाथपुर',
        locationDistrict: user.district || 'बाराबंकी',
        locationState: user.state || 'उत्तर प्रदेश',
        availability: 'TODAY',
        status: 'ACTIVE',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
      });

      if (refreshListings) {
        await refreshListings();
      }

      setStep(5); // Success Screen
    } catch (err: any) {
      setApiError(err.message || 'नेटवर्क त्रुटि (Network error occurred)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* AI Assistant Pre-fill Banner */}
      {fromAssistant && step < 5 && (
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-300 rounded-2xl p-4">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-bold text-purple-900 text-sm">AI सहायक से प्री-भरा गया</p>
            <p className="text-xs text-purple-700 mt-0.5">
              कृपया नीचे दिए गए विवरण की जाँच करें और आवश्यक सुधार करें।
            </p>
          </div>
        </div>
      )}

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

      {/* Voice Toast Success Notification */}
      {voiceToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <span className="text-base">🎙️</span>
          <span>{voiceToast}</span>
        </div>
      )}

      {/* Voice Error Notification */}
      {voiceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{voiceError}</span>
          </div>
          <button
            type="button"
            onClick={clearVoiceError}
            className="text-red-500 hover:text-red-700 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Mode Toggle Bar */}
      {step <= 3 && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              id="voice-mode-toggle"
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200 transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isVoiceMode ? 'सामान्य इनपुट मोड' : '🎤 बोलकर भरें मोड'}</span>
            </button>
          </div>

          {isVoiceMode && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950">AI वॉइस सहायक (Sarvam AI)</h4>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      पूरा वाक्य बोलें: &quot;मेरे पास 200 किलो टमाटर है 24 रुपये भाव&quot;
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="global-voice-mic-btn"
                  onClick={() =>
                    isRecording && activeField === 'global'
                      ? stopRecording()
                      : startRecording('global')
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs ${
                    isRecording && activeField === 'global'
                      ? 'bg-red-600 text-white animate-pulse'
                      : isProcessing && activeField === 'global'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  {isProcessing && activeField === 'global' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>प्रोसेसिंग...</span>
                    </>
                  ) : isRecording && activeField === 'global' ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>रोकें ({recordingSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>बोलना शुरू करें</span>
                    </>
                  )}
                </button>
              </div>

              {isRecording && activeField === 'global' && (
                <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-100/70 p-2 rounded-lg border border-red-200 animate-pulse">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                    माइक खुला है... कृपया अपनी उपज, मात्रा और भाव बोलें
                  </span>
                  <span className="font-mono font-bold">
                    00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                </div>
              )}

              {isProcessing && activeField === 'global' && (
                <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 flex-shrink-0" />
                  <span>Sarvam AI आवाज़ से डेटा निकाल रहा है...</span>
                </div>
              )}
            </div>
          )}
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
                  id="input-crop-name"
                  placeholder="जैसे - गेहूँ, आलू, टमाटर"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  id="mic-crop-name"
                  aria-label="उपज का नाम बोलकर भरें"
                  title="बोलकर उपज का नाम भरें"
                  onClick={() =>
                    isRecording && activeField === 'cropName'
                      ? stopRecording()
                      : startRecording('cropName')
                  }
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                    activeField === 'cropName' && isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : activeField === 'cropName' && isProcessing
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {activeField === 'cropName' && isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeField === 'cropName' && isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              {activeField === 'cropName' && isRecording && (
                <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg animate-pulse">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                    सुन रहे हैं... फसल का नाम बोलें ({recordingSeconds}s)
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="font-bold text-xs underline text-red-800 hover:text-red-950"
                  >
                    रोकें
                  </button>
                </div>
              )}

              {activeField === 'cropName' && isProcessing && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sarvam AI आवाज़ पहचान रहा है...</span>
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
                    id="input-quantity"
                    placeholder="जैसे - 200"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <button
                    type="button"
                    id="mic-quantity"
                    aria-label="मात्रा बोलकर भरें"
                    title="बोलकर मात्रा भरें"
                    onClick={() =>
                      isRecording && activeField === 'quantity'
                        ? stopRecording()
                        : startRecording('quantity')
                    }
                    className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                      activeField === 'quantity' && isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : activeField === 'quantity' && isProcessing
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {activeField === 'quantity' && isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : activeField === 'quantity' && isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <select className="p-3 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50">
                  <option>kg ▾</option>
                  <option>क्विंटल ▾</option>
                </select>
              </div>

              {activeField === 'quantity' && isRecording && (
                <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg animate-pulse">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                    मात्रा बोलें (जैसे: 200 किलो या 5 क्विंटल) ({recordingSeconds}s)
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="font-bold text-xs underline text-red-800 hover:text-red-950"
                  >
                    रोकें
                  </button>
                </div>
              )}

              {activeField === 'quantity' && isProcessing && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sarvam AI मात्रा पहचान रहा है...</span>
                </div>
              )}
            </div>

            {/* Field 4: Minimum Order Quantity */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">न्यूनतम ऑर्डर मात्रा*</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    id="input-min-order"
                    placeholder="जैसे - 20"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <button
                    type="button"
                    id="mic-min-order"
                    aria-label="न्यूनतम मात्रा बोलकर भरें"
                    title="बोलकर न्यूनतम मात्रा भरें"
                    onClick={() =>
                      isRecording && activeField === 'minOrder'
                        ? stopRecording()
                        : startRecording('minOrder')
                    }
                    className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                      activeField === 'minOrder' && isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : activeField === 'minOrder' && isProcessing
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {activeField === 'minOrder' && isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : activeField === 'minOrder' && isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <select className="p-3 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50">
                  <option>kg ▾</option>
                </select>
              </div>

              {activeField === 'minOrder' && isRecording && (
                <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg animate-pulse">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                    न्यूनतम ऑर्डर मात्रा बोलें ({recordingSeconds}s)
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="font-bold text-xs underline text-red-800 hover:text-red-950"
                  >
                    रोकें
                  </button>
                </div>
              )}

              {activeField === 'minOrder' && isProcessing && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sarvam AI न्यूनतम मात्रा पहचान रहा है...</span>
                </div>
              )}
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
                    id="input-price"
                    placeholder="जैसे - 24"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                  <button
                    type="button"
                    id="mic-price"
                    aria-label="कीमत बोलकर भरें"
                    title="बोलकर कीमत भरें"
                    onClick={() =>
                      isRecording && activeField === 'price'
                        ? stopRecording()
                        : startRecording('price')
                    }
                    className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                      activeField === 'price' && isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : activeField === 'price' && isProcessing
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {activeField === 'price' && isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : activeField === 'price' && isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <span className="font-bold text-slate-600">प्रति kg</span>
              </div>

              {activeField === 'price' && isRecording && (
                <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg animate-pulse">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                    कीमत प्रति किलो बोलें (जैसे: 24 रुपये) ({recordingSeconds}s)
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="font-bold text-xs underline text-red-800 hover:text-red-950"
                  >
                    रोकें
                  </button>
                </div>
              )}

              {activeField === 'price' && isProcessing && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sarvam AI कीमत पहचान रहा है...</span>
                </div>
              )}
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

              {/* Hidden file input for gallery & camera */}
              <input
                ref={fileInputRef}
                type="file"
                id="photo-file-input"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />

              {imageUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
                  <span>{imageUploadError}</span>
                  <button
                    type="button"
                    onClick={() => setImageUploadError(null)}
                    className="text-red-500 hover:text-red-700 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!imagePreview ? (
                <div
                  id="photo-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center space-y-2 hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50 group"
                >
                  <Camera className="w-8 h-8 text-slate-400 mx-auto group-hover:text-emerald-600 transition-colors" />
                  <p className="font-bold text-xs text-slate-700">फोटो जोड़ें (Add Photo)</p>
                  <p className="text-[11px] text-slate-400">गैलरी से चुनें या कैमरा खोलें (JPG, PNG, WEBP - अधिकतम 5MB)</p>
                </div>
              ) : (
                <div className="relative border-2 border-emerald-500/40 bg-emerald-50/30 p-3 rounded-2xl flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-emerald-200 shadow-2xs">
                    <img
                      id="uploaded-photo-preview"
                      src={imagePreview}
                      alt="उपज फोटो"
                      className="w-full h-full object-cover"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate">
                        {uploadedFileName || 'produce-photo.jpg'}
                      </span>
                      {imageUrl && !isUploadingImage && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ✓ सेव हो गया
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isUploadingImage ? (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Supabase Storage पर अपलोड हो रहा है...
                        </span>
                      ) : (
                        <span>आकार: {uploadedFileSizeKb} KB · क्लाउड पर सुरक्षित</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        id="btn-change-photo"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>फोटो बदलें</span>
                      </button>
                      <button
                        type="button"
                        id="btn-remove-photo"
                        disabled={isUploadingImage}
                        onClick={handleRemovePhoto}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 underline"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>हटाएं</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
              src={imagePreview || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'}
              alt={cropName || 'उपज की फोटो'}
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

          {apiError && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>आपकी उपज का विवरण खरीदारों को दिखाई देगा।</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={submitting}
              className="w-1/2 bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" />
              <span>जानकारी बदलें</span>
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="w-1/2 bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'सबमिट हो रहा है...' : 'उपज लिस्ट करें'}</span>
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
              src={imageUrl || imagePreview || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=150'}
              alt={cropName || 'उपज फोटो'}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
            />
            <div className="flex-1">
              <h4 className="font-extrabold text-sm text-slate-900">{cropName}</h4>
              <p className="text-slate-600 font-medium">{quantity} kg · ₹{price} / kg</p>
              <p className="text-[11px] text-slate-400 mt-0.5">📍 {user.village}, {user.district}</p>
              {createdListingId && (
                <p className="text-[10px] text-emerald-700 font-mono font-semibold mt-1">ID: #{createdListingId}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {createdListingId && (
              <Link
                href={`/farmer/listings/${createdListingId}`}
                className="w-full bg-white border border-emerald-600 text-emerald-800 font-bold text-xs py-3 rounded-xl block text-center hover:bg-emerald-50 transition-colors shadow-2xs"
              >
                इस लिस्टिंग का विवरण देखें →
              </Link>
            )}
            <Link
              href="/farmer/listings"
              className="w-full bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl block text-center hover:bg-emerald-800 transition-colors shadow-xs"
            >
              मेरी लिस्टिंग देखें →
            </Link>
            <button
              onClick={() => {
                setCreatedListingId(null);
                setCropName('');
                setQuantity('');
                setPrice('');
                setMinOrder('');
                setImageUrl('');
                setImagePreview('');
                setUploadedFileName('');
                setUploadedFileSizeKb(0);
                setImageUploadError(null);
                setStep(1);
              }}
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
