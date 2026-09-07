'use client';

import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Shield,
  HelpCircle,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Package,
  Check,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProduceListing } from '@/types';

export interface TransporterOption {
  id: string;
  name: string;
  tagline: string;
  vehicleType: string;
  rating: number;
  reviewsCount: number;
  eta: string;
  distanceKm: number;
  fare: number;
  originalFare?: number;
  isBestMatch?: boolean;
  features: string[];
}

interface CartItemData {
  listing: ProduceListing;
  quantity: number;
}

interface BuyerDeliveryVikalpViewProps {
  cartItems: CartItemData[];
  onBackToCart: () => void;
  onConfirmOrder: (
    deliveryMethod: 'DELIVERY_PARTNER' | 'SELF_PICKUP',
    selectedTransporter: TransporterOption | null,
    totalFare: number
  ) => Promise<string | void> | string | void;
  isSubmitting?: boolean;
  onViewOrderTracking?: (orderCode: string) => void;
}

export const BuyerDeliveryVikalpView: React.FC<BuyerDeliveryVikalpViewProps> = ({
  cartItems,
  onBackToCart,
  onConfirmOrder,
  isSubmitting = false,
  onViewOrderTracking,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<'DELIVERY_PARTNER' | 'SELF_PICKUP'>('DELIVERY_PARTNER');
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>('raj-1');
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Exact mock options from scr-007
  const transporterOptions: TransporterOption[] = [
    {
      id: 'raj-1',
      name: 'Raj Transport (राज ट्रांसपोर्ट)',
      tagline: 'SmartMatch द्वारा सुझाया गया (Best Match)',
      vehicleType: 'मिनी ट्रक (1,000 kg)',
      rating: 4.6,
      reviewsCount: 128,
      eta: '2h 30m (आज, 3:00 PM तक)',
      distanceKm: 82,
      fare: 250,
      originalFare: 320,
      isBestMatch: true,
      features: ['📍 GPS ट्रैकिंग', '🛡️ बीमा उपलब्ध', '✅ सुरक्षित डिलीवरी'],
    },
    {
      id: 'shakti-2',
      name: 'Shakti Logistics (शक्ति लॉजिस्टिक्स)',
      tagline: 'विश्वसनीय सर्विस व समयबद्ध पूर्ति',
      vehicleType: 'पिकअप वैन (800 kg)',
      rating: 4.4,
      reviewsCount: 96,
      eta: '3h 10m (आज, 3:40 PM तक)',
      distanceKm: 95,
      fare: 280,
      originalFare: 350,
      features: ['📍 GPS ट्रैकिंग', '✅ सुरक्षित डिलीवरी'],
    },
    {
      id: 'fast-3',
      name: 'FastMove Cargo (फास्टमूव कार्गो)',
      tagline: 'कम समय में एक्सप्रेस डिलीवरी',
      vehicleType: 'एक्सप्रेस मिनी ट्रक',
      rating: 4.5,
      reviewsCount: 74,
      eta: '2h 45m (आज, 3:15 PM तक)',
      distanceKm: 78,
      fare: 260,
      originalFare: 330,
      features: ['📍 GPS ट्रैकिंग', '🛡️ बीमा उपलब्ध'],
    },
    {
      id: 'kisan-4',
      name: 'Kisan Express (किसान एक्सप्रेस)',
      tagline: 'किफ़ायती और ग्रामीण क्षेत्रों के लिए अनुकूल',
      vehicleType: 'टाटा ऐस',
      rating: 4.2,
      reviewsCount: 53,
      eta: '4h 20m (आज, 4:50 PM तक)',
      distanceKm: 110,
      fare: 220,
      features: ['📍 GPS ट्रैकिंग'],
    },
    {
      id: 'bharat-5',
      name: 'Bharat Roadways (भारत रोडवेज)',
      tagline: 'सुरक्षित और सही समय पर भारी लोड',
      vehicleType: 'मीडियम ट्रक',
      rating: 4.1,
      reviewsCount: 41,
      eta: '5h 30m (आज, 6:00 PM तक)',
      distanceKm: 125,
      fare: 240,
      features: ['🛡️ बीमा उपलब्ध'],
    },
  ];

  const selectedTransporter =
    transporterOptions.find((t) => t.id === selectedTransporterId) || transporterOptions[0];

  const deliveryCharge = deliveryMode === 'SELF_PICKUP' ? 0 : selectedTransporter.fare;
  const productSubtotal = cartItems.reduce(
    (sum, item) => sum + item.listing.pricePerKg * item.quantity,
    0
  );
  const totalAmount = productSubtotal + deliveryCharge;

  // Total genuine savings vs mandi reference (R-001 / Req 48)
  const estimatedSavings = cartItems.reduce((sum, item) => {
    if (item.listing.marketPricePerKg && item.listing.marketPricePerKg > item.listing.pricePerKg) {
      return sum + (item.listing.marketPricePerKg - item.listing.pricePerKg) * item.quantity;
    }
    return sum;
  }, 0);

  const handleProceed = async () => {
    setIsProcessing(true);
    try {
      const generatedCode = await onConfirmOrder(
        deliveryMode,
        deliveryMode === 'DELIVERY_PARTNER' ? selectedTransporter : null,
        deliveryCharge
      );

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#34D399', '#F59E0B', '#3B82F6'],
        });
      } catch (e) {}

      setConfirmedOrderCode(typeof generatedCode === 'string' ? generatedCode : '#ORD5678');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-28">
      {/* 1. HEADER (scr-007) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToCart}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← टोकरी में वापस जाएं (Back to Cart)</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            डिलीवरी विकल्प चुनें <span className="text-slate-500 font-normal text-xl">(Delivery Vikalp)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            हम आपके लिए सबसे अच्छा, तेज़ और किफ़ायती डिलीवरी विकल्प चुनकर लाए हैं।
          </p>
        </div>
      </div>

      {/* 2. GREEN INFO BANNER: SmartMatch (scr-007) */}
      <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold">
            🌟 SmartMatch आपके ऑर्डर के लिए सबसे उपयुक्त डिलीवरी सुझा रहा है
          </h3>
          <p className="text-[11px] sm:text-xs text-emerald-800 mt-0.5">
            लोड क्षमता, निकटतम रूट और किसान की फसल ताजगी विंडो के अनुसार सर्वोत्तम ट्रांसपोर्टर अनुशंसित किया गया है।
          </p>
        </div>
      </div>

      {/* 3. TWO DELIVERY MODES: Smart Delivery vs Self Pick-up (scr-007) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mode 1: Smart Delivery */}
        <div
          onClick={() => setDeliveryMode('DELIVERY_PARTNER')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
            deliveryMode === 'DELIVERY_PARTNER'
              ? 'bg-emerald-50/70 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  deliveryMode === 'DELIVERY_PARTNER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Smart Delivery (सुझाया गया)
                </h3>
                <p className="text-xs text-emerald-700 font-semibold">आज डिलीवरी • 2-3 घंटे में</p>
              </div>
            </div>

            <span className="text-base font-extrabold text-emerald-800">₹250 से शुरू</span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            हम आपके लिए बेस्ट ट्रांसपोर्टर चुनेंगे। सीधे फार्म गेट से आपके पते पर सुरक्षित और लाइव-ट्रैक डिलीवरी।
          </p>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
              तेज़
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
              भरोसेमंद
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
              लाइव ट्रैकिंग
            </span>
          </div>
        </div>

        {/* Mode 2: Self Pick-up */}
        <div
          onClick={() => setDeliveryMode('SELF_PICKUP')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
            deliveryMode === 'SELF_PICKUP'
              ? 'bg-emerald-50/70 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  deliveryMode === 'SELF_PICKUP'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Self Pick-up (स्वयं पिकअप करें)
                </h3>
                <p className="text-xs text-slate-500">जब चाहें पिकअप करें</p>
              </div>
            </div>

            <span className="text-base font-extrabold text-emerald-700 uppercase">FREE</span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            FPO केंद्र अथवा किसान के फार्म गेट से स्वयं अपना वाहन लाकर सामान उठाएं। शून्य डिलीवरी चार्ज।
          </p>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
              कोई डिलीवरी शुल्क नहीं
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
              सुविधाजनक समय
            </span>
          </div>
        </div>
      </div>

      {/* 4. SPLIT: TRANSPORTERS TABLE (LEFT 2 COLS) + ORDER SUMMARY (RIGHT 1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: All Delivery Options Table (scr-007) */}
        <div className="lg:col-span-2 space-y-4">
          {deliveryMode === 'DELIVERY_PARTNER' ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    सभी डिलीवरी विकल्प (Available Transporters)
                  </h3>
                  <p className="text-xs text-slate-500">
                    रेटिंग, अनुमानित समय और किराए के आधार पर अपनी पसंद का ट्रांसपोर्टर चुनें
                  </p>
                </div>
              </div>

              {/* Transporters List Rows */}
              <div className="divide-y divide-slate-100">
                {transporterOptions.map((item) => {
                  const isSelected = selectedTransporterId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTransporterId(item.id)}
                      className={`p-4 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-1">
                          <input
                            type="radio"
                            name="transporter"
                            checked={isSelected}
                            onChange={() => setSelectedTransporterId(item.id)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900">{item.name}</h4>
                            {item.isBestMatch && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                BEST MATCH
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{item.tagline}</p>

                          {/* Features Chips */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.features.map((f, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Meta: ETA, Distance, Rating, Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right pl-7 sm:pl-0">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.eta}</div>
                          <div className="text-[11px] text-slate-400">
                            {item.distanceKm} km आपसे • ★{item.rating} ({item.reviewsCount})
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-extrabold text-slate-900">
                            ₹{item.fare}
                          </div>
                          {item.originalFare && (
                            <div className="text-xs text-slate-400 line-through">
                              ₹{item.originalFare}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-2xs text-center">
              <Package className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">स्वयं पिकअप चुना गया (Self Pick-up Selected)</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                ऑर्डर स्वीकृत होने के पश्चात आपको किसान/FPO फार्म का सटीक पता और संपर्क नंबर प्राप्त होगा। आप सुविधा अनुसार 24 घंटे में कभी भी पिकअप कर सकते हैं।
              </p>
            </div>
          )}

          {/* Trust Guarantee Strip (scr-007) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              डिलीवरी सुरक्षा गारंटी
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">100% सुरक्षित डिलीवरी</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-700 font-medium">क्षति होने पर पूर्ण मुआवजा</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-slate-700 font-medium">लाइव जीपीएस ट्रैकिंग</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-slate-700 font-medium">सीधे खेत से आपके पास</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pricing Breakdown (scr-007) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>आपका ऑर्डर सारांश</span>
              <span className="text-xs text-slate-500">({cartItems.length} आइटम)</span>
            </h3>

            {/* Items list */}
            <div className="space-y-2.5 pb-4 border-b border-slate-100 max-h-48 overflow-y-auto">
              {cartItems.map((ci, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={ci.listing.image}
                      alt={ci.listing.cropHindi}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{ci.listing.cropHindi}</p>
                      <p className="text-[10px] text-slate-400">{ci.quantity} kg</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{ci.listing.pricePerKg * ci.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Strict Price Separation: Subtotal vs Delivery Fee (R-001/R-004) */}
            <div className="py-3 space-y-2 text-xs border-b border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>उप-योग (Product Subtotal):</span>
                <span className="font-bold text-slate-800">₹{productSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>डिलीवरी शुल्क (Delivery Charges):</span>
                <span className="font-bold text-emerald-700">
                  {deliveryMode === 'SELF_PICKUP' ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            {/* Total Amount */}
            <div className="pt-3 flex justify-between items-baseline mb-3">
              <span className="text-sm font-extrabold text-slate-900">कुल राशि (Total Amount):</span>
              <span className="text-xl font-extrabold text-slate-900">₹{totalAmount}</span>
            </div>

            {/* Savings Banner */}
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center text-xs font-bold text-emerald-800 border border-emerald-200/80 mb-4">
              🌿 आप ₹{estimatedSavings} बचा रहे हैं (बाजार मूल्य की तुलना में)
            </div>

            {/* Smart Delivery Benefits */}
            <div className="space-y-1.5 text-[11px] text-slate-600 mb-4">
              <p className="font-bold text-slate-700 mb-1">Smart Delivery के फायदे:</p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>हम सबसे अच्छा और नजदीकी ट्रांसपोर्टर चुनेंगे</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>तेज़ और भरोसेमंद डिलीवरी</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>लाइव ट्रैकिंग व डिलीवरी OTP सत्यापन</span>
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>24x7 किसान सेतु सहायता</span>
              </p>
            </div>

            {/* Support Call/Chat Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">मदद चाहिए?</span>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>सपोर्ट डेस्क</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. STICKY BOTTOM ACTION BAR (scr-007) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start text-xs">
            <div>
              <span className="text-slate-500 block">चयनित विकल्प:</span>
              <strong className="text-slate-900 text-sm">
                {deliveryMode === 'DELIVERY_PARTNER' ? selectedTransporter.name : 'स्वयं पिकअप (Self Pick-up)'}
              </strong>
            </div>

            {deliveryMode === 'DELIVERY_PARTNER' && (
              <div className="border-l border-slate-200 pl-4 hidden md:block">
                <span className="text-slate-500 block">ETA:</span>
                <strong className="text-slate-900 text-xs">{selectedTransporter.eta}</strong>
              </div>
            )}

            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-500 block">कुल देय राशि:</span>
              <strong className="text-base text-emerald-800 font-extrabold">₹{totalAmount}</strong>
            </div>
          </div>

          <button
            onClick={handleProceed}
            disabled={isSubmitting || isProcessing || cartItems.length === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>ऑर्डर पुष्टि जारी है...</span>
              </div>
            ) : (
              <>
                <span>इस विकल्प से आगे बढ़ें (Confirm Order)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. ORDER CONFIRMATION MODAL WITH CONFETTI (scr-007 / scr-015) */}
      {confirmedOrderCode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50 shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>ऑर्डर सफलतापूर्वक दर्ज हुआ • Verified Order</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              धन्यवाद! ऑर्डर प्राप्त हो गया है
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ऑर्डर कोड: <strong className="text-slate-800">{confirmedOrderCode}</strong> • किसान व डिलीवरी पार्टनर को सूचना भेज दी गई है।
            </p>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>उत्पाद उप-योग:</span>
                <span className="font-bold text-slate-900">₹{productSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>डिलीवरी मोड:</span>
                <span className="font-bold text-slate-900">
                  {deliveryMode === 'DELIVERY_PARTNER' ? selectedTransporter.name : 'Self Pick-up (मुफ़्त)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>डिलीवरी शुल्क:</span>
                <span className="font-bold text-emerald-700">
                  {deliveryMode === 'DELIVERY_PARTNER' ? `₹${deliveryCharge}` : '₹0'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>कुल भुगतान:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  if (onViewOrderTracking) {
                    onViewOrderTracking(confirmedOrderCode);
                  }
                  setConfirmedOrderCode(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>लाइव ट्रैक करें (Track Order)</span>
              </button>
              <button
                onClick={() => {
                  setConfirmedOrderCode(null);
                  onBackToCart();
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                होम पेज पर जाएं
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUPPORT MODAL */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>किसान सेतु ग्राहक सहायता (24x7)</span>
              </h3>
              <button onClick={() => setSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="font-bold text-emerald-950 mb-0.5">📞 टोल-फ्री हेल्पलाइन</p>
                <p className="text-emerald-800 text-sm font-black tracking-wider">1800-123-4567</p>
                <p className="text-[11px] text-emerald-700 mt-1">सोमवार से रविवार, 24 घंटे उपलब्ध</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-900 mb-0.5">💬 WhatsApp सपोर्ट</p>
                <p className="text-slate-700 font-bold">+91 98765 43210</p>
                <p className="text-[11px] text-slate-500 mt-1">ऑर्डर ट्रैकिंग व तात्कालिक सहायता हेतु</p>
              </div>
            </div>

            <button
              onClick={() => setSupportModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
