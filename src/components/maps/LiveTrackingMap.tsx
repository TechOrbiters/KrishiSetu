'use client';

/**
 * KRISHISETU — Live Tracking Map Component
 * Uses Google Maps Embed API (directions mode) to show real route.
 * No additional npm packages needed — pure iframe embed.
 * API Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser-safe, HTTP referrer restricted)
 */

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

export interface TrackingLocation {
  lat: number;
  lng: number;
  label: string;
  address: string;
}

export interface LiveTrackingMapProps {
  origin: TrackingLocation;
  destination: TrackingLocation;
  /** Optional: transporter live lat/lng (Firebase RTDB driven) */
  transporterLocation?: { lat: number; lng: number };
  height?: string;
  showEta?: boolean;
}

interface RouteData {
  distanceKm: number;
  durationMinutes: number;
  etaText: string;
  isApproximate: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  origin,
  destination,
  transporterLocation,
  height = '280px',
  showEta = true,
}) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Build Google Maps Embed URL (Directions mode — shows real route polyline)
  const buildEmbedUrl = () => {
    if (!apiKey) return null;
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const params = new URLSearchParams({
      key: apiKey,
      origin: originStr,
      destination: destStr,
      mode: 'driving',
      language: 'hi',
      maptype: 'roadmap',
    });
    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  };

  // Fetch ETA from backend route API
  const fetchRouteData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/location/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setRouteData(json.data);
        }
      }
    } catch (err) {
      console.warn('[LiveTrackingMap] Failed to fetch route ETA:', err);
      // Fallback: haversine approximation
      const R = 6371;
      const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
      const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((origin.lat * Math.PI) / 180) *
          Math.cos((destination.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      const durationMinutes = Math.round((distanceKm / 40) * 60);
      setRouteData({ distanceKm, durationMinutes, etaText: `${durationMinutes} मिनट`, isApproximate: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  const embedUrl = buildEmbedUrl();

  // Google Maps direct directions link (opens in new tab)
  const googleMapsLink = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner"
        style={{ height }}
      >
        {/* Loading state */}
        {!mapLoaded && !mapError && embedUrl && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">मानचित्र लोड हो रहा है...</p>
          </div>
        )}

        {/* Error/No API Key fallback */}
        {(!embedUrl || mapError) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 p-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">मानचित्र अनुपलब्ध</p>
              <p className="text-xs text-slate-500 mt-1">Google Maps API key configure करें</p>
            </div>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Google Maps पर देखें
            </a>
          </div>
        )}

        {/* Real Google Maps Embed iFrame */}
        {embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="KRISHISETU Live Tracking Map"
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapError(true)}
            className={`absolute inset-0 transition-opacity duration-500 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Live Transporter Overlay Badge (Firebase RTDB driven) */}
        {mapLoaded && transporterLocation && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <Navigation className="w-3.5 h-3.5" />
            <span>ट्रांसपोर्टर लाइव</span>
          </div>
        )}

        {/* Open in Google Maps button (top-right overlay) */}
        {mapLoaded && (
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Google Maps
          </a>
        )}
      </div>

      {/* Route Info Bar */}
      {showEta && (
        <div className="grid grid-cols-3 gap-3">
          {/* Origin */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">पिकअप</p>
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{origin.address}</p>
            </div>
          </div>

          {/* ETA */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <button
              onClick={fetchRouteData}
              disabled={isRefreshing}
              className="mb-1"
              title="Refresh ETA"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : 'hover:text-emerald-600'}`} />
            </button>
            {routeData ? (
              <>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {routeData.durationMinutes < 60
                    ? `${routeData.durationMinutes} मि`
                    : `${Math.floor(routeData.durationMinutes / 60)}घं ${routeData.durationMinutes % 60}मि`}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">{routeData.distanceKm} km</p>
                {routeData.isApproximate && (
                  <p className="text-[9px] text-amber-600 font-semibold">~ अनुमानित</p>
                )}
              </>
            ) : (
              <div className="skeleton w-16 h-4 rounded" />
            )}
          </div>

          {/* Destination */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 justify-end text-right">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">डिलीवरी</p>
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{destination.address}</p>
            </div>
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};
