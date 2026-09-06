'use client';

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Navigation,
  ChevronRight,
  Package,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { TransporterTrip, TripStatus } from '@/types/transporter';

interface Props {
  trips: TransporterTrip[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateTripStatus: (tripId: string, action: 'ARRIVED_AT_PICKUP' | 'CONFIRM_PICKUP' | 'START_TRANSIT' | 'ARRIVED_DESTINATION' | 'DELIVERED') => Promise<void>;
  onOpenLiveTracking: (trip: TransporterTrip) => void;
}

export default function TransporterMyTrips({
  trips,
  loading,
  onRefresh,
  onUpdateTripStatus,
  onOpenLiveTracking,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredTrips = trips.filter((t) => {
    if (filter === 'active') {
      return !['DELIVERED', 'CANCELLED'].includes(t.status);
    }
    if (filter === 'completed') {
      return t.status === 'DELIVERED';
    }
    if (filter === 'cancelled') {
      return t.status === 'CANCELLED';
    }
    return true;
  });

  const handleAction = async (tripId: string, action: 'ARRIVED_AT_PICKUP' | 'CONFIRM_PICKUP' | 'START_TRANSIT' | 'ARRIVED_DESTINATION' | 'DELIVERED') => {
    setUpdatingId(tripId);
    try {
      await onUpdateTripStatus(tripId, action);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER & STATUS TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">मेरी ट्रिप्स (My Trips & Logistics Lifecycle)</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            पिक-अप से डिलीवरी तक वास्तविक समय स्थिति प्रबंधन और रूट ट्रैकिंग
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs font-bold shadow-2xs">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'active'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            सक्रिय ({trips.filter((t) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(t.status)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'completed'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            पूर्ण ({trips.filter((t) => t.status === 'DELIVERED').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            सभी ({trips.length})
          </button>
        </div>
      </div>

      {/* 2. TRIP LIST CARDS */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-56" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Truck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {filter === 'active'
              ? 'वर्तमान में कोई सक्रिय ट्रिप नहीं है'
              : filter === 'completed'
              ? 'अभी तक कोई पूर्ण ट्रिप नहीं है'
              : 'कोई ट्रिप नहीं मिली'}
          </h3>
          <p className="text-xs text-slate-500">
            उपलब्ध डिलीवरी कार्य (SmartMatch) टैब से नई ट्रिप स्वीकार करें।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => {
            const isDelivered = trip.status === 'DELIVERED';
            const isCancelled = trip.status === 'CANCELLED';

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5"
              >
                {/* Trip Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                          {trip.crop_name} ({trip.weight_kg} किग्रा)
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                          ऑर्डर #{trip.order_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                        ट्रिप आईडी: #{trip.id.slice(-8)} • दूरी: {trip.distance_km} किमी
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">100% ड्राइवर भाड़ा</span>
                    <strong className="text-xl font-black text-orange-700">₹{trip.fare_amount}</strong>
                  </div>
                </div>

                {/* 6-STAGE TIMELINE PROGRESS BAR */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">
                    लाइफसाइकिल स्थिति (Trip Progress)
                  </span>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
                    {trip.timeline?.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg transition-all ${
                          item.current
                            ? 'bg-blue-600 text-white shadow-xs'
                            : item.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}
                      >
                        <span className="block text-xs mb-0.5">
                          {item.completed && !item.current ? '✓' : item.current ? '●' : '○'}
                        </span>
                        <span className="leading-tight block line-clamp-2">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route & Contact details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Pickup / Drop Addresses */}
                  <div className="space-y-3 bg-white border border-slate-100 p-3.5 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-600 font-bold text-sm">🟢</span>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block">पिक-अप (खेत / मंडी):</span>
                        <strong className="text-slate-800 text-xs sm:text-sm">{trip.pickup_address}</strong>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
                          <span>किसान: {trip.farmer_name}</span>
                          <a
                            href={`tel:${trip.farmer_phone}`}
                            className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>कॉल करें</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
                      <span className="text-red-600 font-bold text-sm">🔴</span>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block">डिलीवरी गंतव्य (खरीदार):</span>
                        <strong className="text-slate-800 text-xs sm:text-sm">{trip.delivery_address}</strong>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
                          <span>खरीदार: {trip.buyer_name}</span>
                          <a
                            href={`tel:${trip.buyer_phone}`}
                            className="text-blue-700 font-bold flex items-center gap-1 hover:underline"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>कॉल करें</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Live Map Callout */}
                  <div className="flex flex-col justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">लाइव ट्रैकिंग:</span>
                      <button
                        onClick={() => onOpenLiveTracking(trip)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>लाइव रूट मैप खोलें</span>
                      </button>
                    </div>

                    {/* Sequential Lifecycle Action Buttons */}
                    <div className="space-y-2">
                      {trip.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleAction(trip.id, 'ARRIVED_AT_PICKUP')}
                          disabled={updatingId === trip.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          <span>
                            {updatingId === trip.id ? 'अपडेट हो रहा है...' : '1. खेत / मंडी पहुंचे (Mark Arrived at Pickup)'}
                          </span>
                        </button>
                      )}

                      {trip.status === 'ARRIVED_AT_PICKUP' && (
                        <button
                          onClick={() => handleAction(trip.id, 'CONFIRM_PICKUP')}
                          disabled={updatingId === trip.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Package className="w-4 h-4" />
                          <span>
                            {updatingId === trip.id ? 'लोडिंग पुष्टि हो रही है...' : '2. लोड उठाया - पुष्टि करें (Confirm Cargo Picked Up)'}
                          </span>
                        </button>
                      )}

                      {trip.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleAction(trip.id, 'START_TRANSIT')}
                          disabled={updatingId === trip.id}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>
                            {updatingId === trip.id ? 'शुरू हो रहा है...' : '3. रास्ते में निकलें (Start In Transit)'}
                          </span>
                        </button>
                      )}

                      {trip.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleAction(trip.id, 'ARRIVED_DESTINATION')}
                          disabled={updatingId === trip.id}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>
                            {updatingId === trip.id ? 'अपडेट हो रहा है...' : '4. खरीदार गंतव्य पहुंचे (Arrived at Destination)'}
                          </span>
                        </button>
                      )}

                      {(trip.status === 'ARRIVED_AT_DESTINATION' || trip.status === 'NEAR_DESTINATION') && (
                        <button
                          onClick={() => handleAction(trip.id, 'DELIVERED')}
                          disabled={updatingId === trip.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {updatingId === trip.id ? 'डिलीवरी दर्ज हो रही है...' : '5. डिलीवरी पूर्ण करें (Confirm Delivery & Settle Funds)'}
                          </span>
                        </button>
                      )}

                      {isDelivered && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold p-3 rounded-xl text-center">
                          ✓ डिलीवरी सफलतापूर्वक पूर्ण! ₹{trip.fare_amount} खाते में जमा हो चुके हैं।
                        </div>
                      )}

                      {isCancelled && (
                        <div className="bg-red-50 text-red-800 border border-red-200 text-xs font-bold p-3 rounded-xl text-center">
                          ✕ यह ट्रिप रद्द कर दी गई है।
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
