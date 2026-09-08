'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { FarmerLayout } from '@/components/layout/FarmerLayout';
import { useFarmerStore } from '@/lib/store/farmerStore';
import { evaluateFreshness } from '@/lib/domain/freshness';
import { formatINR } from '@/lib/domain/pricing';

export default function TransportRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getOrderById } = useFarmerStore();

  const order = getOrderById(id);

  const transporters = [
    {
      id: 't1',
      name: 'संदीप कुमार (Sandeep Kumar)',
      vehicleType: 'Mini Truck (छोटा ट्रक)',
      vehicleReg: 'UP32 AB 1234',
      capacityKg: 1000,
      distanceKm: 2.4,
      etaHours: 3.3, // 3h 20m
      fare: 1500,
      rating: 4.8,
      tripsCount: 128,
      isBestMatch: true,
    },
    {
      id: 't2',
      name: 'राज ट्रांसपोर्ट (Raj Transport)',
      vehicleType: 'Pickup (पिकअप)',
      vehicleReg: 'UP32 CD 5678',
      capacityKg: 700,
      distanceKm: 4.1,
      etaHours: 2.2, // 2h 10m
      fare: 1700,
      rating: 4.9,
      tripsCount: 210,
      isBestMatch: false,
    },
    {
      id: 't3',
      name: 'धीमी एक्सप्रेस (Slow Express)',
      vehicleType: 'Tractor Trolley',
      vehicleReg: 'UP32 EF 9012',
      capacityKg: 1200,
      distanceKm: 18.0,
      etaHours: 27.0, // Exceeds 24h freshness window!
      fare: 1100,
      rating: 3.9,
      tripsCount: 45,
      isBestMatch: false,
    },
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-1 text-slate-500 hover:text-slate-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-bold text-xl text-slate-900">डिलीवरी के लिए वाहन खोजें (Transport Request)</h1>
              <p className="text-xs text-slate-500">SmartTransport + FreshRoute सुरक्षा जांच</p>
            </div>
          </div>

          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300">
            🛡️ Delivery charge paid by buyer (₹0 cost to farmer)
          </span>
        </div>

        {/* Order Details Context Card */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div>
              <span className="text-xs text-emerald-400 font-bold block">ऑर्डर # {order?.orderNumber || 'ORD1241'}</span>
              <h2 className="text-lg font-extrabold">{order?.cropNameHindi || 'टमाटर'} ({order?.quantityKg || 200} kg)</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">ताज़गी विंडो सीमा</span>
              <span className="text-sm font-bold text-amber-300">24 घंटे (24h)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
            <div>📍 पिकअप: <strong>बैजनाथपुर, बाराबंकी</strong></div>
            <div>🏁 गंतव्य: <strong>आलमबाग, लखनऊ</strong></div>
          </div>
        </div>

        {/* Transporters List */}
        <div className="space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-green" />
            <span>उपलब्ध ट्रांसपोर्टर (FreshRoute अनुशंसित)</span>
          </h2>

          <div className="space-y-3">
            {transporters.map((t) => {
              const freshnessEval = evaluateFreshness(new Date().toISOString(), 24, t.etaHours);

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    !freshnessEval.eligible
                      ? 'bg-slate-100 border-slate-300 opacity-60'
                      : t.isBestMatch
                      ? 'bg-white border-2 border-brand-green shadow-md ring-2 ring-brand-green/20'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {t.isBestMatch && (
                          <span className="bg-brand-green text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            ★ BEST MATCH
                          </span>
                        )}
                        <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                        <span className="flex items-center text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                          {t.rating} ({t.tripsCount})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        वाहन: <strong>{t.vehicleType}</strong> ({t.vehicleReg}) · क्षमता: {t.capacityKg} kg · दूरी: {t.distanceKm} km
                      </p>

                      {/* FreshRoute Constraint Badge */}
                      <div className="pt-1">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                            freshnessEval.eligible
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {freshnessEval.eligible ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span>
                            {freshnessEval.eligible
                              ? ` Freshness-safe (ETA: ${t.etaHours}h)`
                              : ` Cannot meet freshness window (ETA: ${t.etaHours}h > 24h)`}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">अनुमानित भाड़ा (Paid by buyer)</span>
                        <span className="text-lg font-extrabold text-brand-green">{formatINR(t.fare)}</span>
                      </div>

                      <button
                        disabled={!freshnessEval.eligible}
                        onClick={() => alert(`वाहन ${t.name} का चयन किया गया। डिलीवरी ट्रैकिंग शुरू हो गई है।`)}
                        className={`mt-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all ${
                          freshnessEval.eligible
                            ? 'bg-brand-green text-white hover:bg-brand-deep shadow-xs'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {freshnessEval.eligible ? 'वाहन चुनें (Select)' : 'अयोग्य (Ineligible)'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
