'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  RefreshCw,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { TransporterTrip } from '@/types/transporter';
import { LiveTrackingMap } from '@/components/maps/LiveTrackingMap';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';

interface Props {
  trips: TransporterTrip[];
  selectedTripId?: string | null;
  onUpdateTripStatus: (tripId: string, action: any) => Promise<void>;
}

export default function TransporterLiveTracking({
  trips,
  selectedTripId,
  onUpdateTripStatus,
}: Props) {
  const activeTrips = trips.filter((t) => !['DELIVERED', 'CANCELLED'].includes(t.status));
  const [currentTripId, setCurrentTripId] = useState<string>(
    selectedTripId || (activeTrips[0]?.id || '')
  );

  const activeTrip = trips.find((t) => t.id === currentTripId) || activeTrips[0] || null;

  // Live GPS simulation / browser geolocation
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState('');

  useEffect(() => {
    if (!activeTrip) return;

    // Fetch browser geolocation if available
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback along pickup-drop line
          setGpsLocation({
            lat: (activeTrip.pickup_lat + activeTrip.delivery_lat) / 2,
            lng: (activeTrip.pickup_lng + activeTrip.delivery_lng) / 2,
          });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [activeTrip?.id]);

  const handleSendLocationPing = async () => {
    if (!activeTrip) return;
    setIsUpdatingGps(true);
    setLocationSuccess('');

    try {
      const lat = gpsLocation?.lat || (activeTrip.pickup_lat + 0.02);
      const lng = gpsLocation?.lng || (activeTrip.pickup_lng + 0.02);

      const headers = await getAuthHeaders();
      const res = await fetch(getApiUrl(`/api/shipments/${activeTrip.id}/location`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          speed_kmh: 38,
          heading: 90,
        }),
      });

      if (res.ok) {
        setLocationSuccess('GPS लोकेशन सफलतापूर्वक अपडेट की गई (Telemetry Synced)');
        setTimeout(() => setLocationSuccess(''), 3000);
      }
    } catch (err) {
      console.warn('Location ping error:', err);
    } finally {
      setIsUpdatingGps(false);
    }
  };

  if (!activeTrip) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
        <Navigation className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">कोई सक्रिय ट्रिप उपलब्ध नहीं है</h3>
        <p className="text-xs text-slate-500">
          ट्रैकिंग शुरू करने के लिए कृपया पहले उपलब्ध कार्यों में से कोई ट्रिप स्वीकार करें।
        </p>
      </div>
    );
  }

  const origin = {
    lat: activeTrip.pickup_lat || 26.8467,
    lng: activeTrip.pickup_lng || 80.9462,
    label: activeTrip.pickup_address,
    address: activeTrip.pickup_address,
  };

  const destination = {
    lat: activeTrip.delivery_lat || 26.9200,
    lng: activeTrip.delivery_lng || 81.1800,
    label: activeTrip.delivery_address,
    address: activeTrip.delivery_address,
  };

  const transporterLiveLoc = gpsLocation
    ? {
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        updatedAt: Date.now(),
        speedKmh: 42,
        heading: 85,
      }
    : undefined;

  return (
    <div className="space-y-4">
      {/* Trip Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              लाइव रूट व GPS ट्रैकिंग (OpenStreetMap & OSRM)
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              ऑर्डर #{activeTrip.order_number} • {activeTrip.crop_name} ({activeTrip.weight_kg} kg)
            </span>
          </div>
        </div>

        {/* Dropdown if multiple active trips */}
        {activeTrips.length > 1 && (
          <div className="relative">
            <select
              value={currentTripId}
              onChange={(e) => setCurrentTripId(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              {activeTrips.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id.slice(-6).toUpperCase()} - {t.crop_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSendLocationPing}
          disabled={isUpdatingGps}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingGps ? 'animate-spin' : ''}`} />
          <span>GPS पिंग भेजें (Update GPS)</span>
        </button>
      </div>

      {locationSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{locationSuccess}</span>
        </div>
      )}

      {/* Map Embed */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <LiveTrackingMap
          origin={origin}
          destination={destination}
          transporterLocation={transporterLiveLoc}
          height="420px"
          showEta={true}
        />

        {/* Trip Quick Controls Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">वर्तमान स्थिति:</span>
            <span className="bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-lg">
              {activeTrip.status === 'ACCEPTED'
                ? 'स्वीकृत (Heading to Pickup)'
                : activeTrip.status === 'ARRIVED_AT_PICKUP'
                ? 'पिक-अप पर पहुंचे'
                : activeTrip.status === 'PICKED_UP'
                ? 'लोड उठाया गया'
                : activeTrip.status === 'IN_TRANSIT'
                ? 'रास्ते में (In Transit)'
                : activeTrip.status === 'ARRIVED_AT_DESTINATION'
                ? 'गंतव्य पहुंचे'
                : activeTrip.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTrip.status === 'IN_TRANSIT' && (
              <button
                onClick={() => onUpdateTripStatus(activeTrip.id, 'ARRIVED_DESTINATION')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                गंतव्य पहुंच दर्ज करें (Mark Arrived)
              </button>
            )}

            {(activeTrip.status === 'ARRIVED_AT_DESTINATION' || activeTrip.status === 'NEAR_DESTINATION') && (
              <button
                onClick={() => onUpdateTripStatus(activeTrip.id, 'DELIVERED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>डिलीवरी पूर्ण करें (Confirm Delivery)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
