'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  pickupLocation?: { lat: number; lng: number; label?: string };
  deliveryLocation?: { lat: number; lng: number; label?: string };
  transporterLocation?: { lat: number; lng: number; label?: string };
  height?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = { lat: 26.8467, lng: 80.9462 },
  pickupLocation,
  deliveryLocation,
  transporterLocation,
  height = '300px',
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col items-center justify-center p-4 text-center select-none shadow-2xs" style={{ height }}>
      {/* Interactive Map Visual Mock Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

      {/* Decorative Route Polyline */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-600 stroke-[3] stroke-dasharray-4">
        <path d="M 50 150 Q 180 80 320 180" fill="none" />
      </svg>

      {/* Location Markers */}
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-md text-xs font-bold text-slate-800">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{pickupLocation?.label || 'बैजनापुर, बाराबंकी (पिकअप)'}</span>
        </div>

        {transporterLocation && (
          <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-md text-xs font-bold animate-pulse">
            <Navigation className="w-4 h-4 fill-current" />
            <span>लाइव ट्रक (45 km/h)</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-xs text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded">
        Google Maps API (Client Restricted)
      </div>
    </div>
  );
};
