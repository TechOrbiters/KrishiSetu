'use client';

/**
 * KRISHISETU — Live Tracking Map Component (Open Map Stack)
 * Wrapper around LeafletMapInner with dynamic SSR loading, route fetching, and stale location tracking.
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { TrackingLocation, TransporterLiveLocation, RouteResult, checkLocationStale } from '@/lib/maps/types';
import { getRoute } from '@/lib/api/client';

// Dynamic import for LeafletMapInner to prevent SSR window/document initialization errors
const LeafletMapInner = dynamic(
  () => import('./LeafletMapInner').then((mod) => mod.LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">OpenStreetMap लोड हो रहा है...</p>
      </div>
    ),
  }
);

export interface LiveTrackingMapProps {
  origin: TrackingLocation;
  destination: TrackingLocation;
  /** Optional: live transporter location from Firebase RTDB */
  transporterLocation?: TransporterLiveLocation;
  height?: string;
  showEta?: boolean;
  onRouteCalculated?: (route: RouteResult) => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  origin,
  destination,
  transporterLocation,
  height = '280px',
  showEta = true,
  onRouteCalculated,
}) => {
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const fetchRoute = async () => {
    setIsLoadingRoute(true);
    try {
      const res = await getRoute(origin, destination);
      setRouteData(res);
      if (onRouteCalculated) {
        onRouteCalculated(res);
      }
    } catch (err) {
      console.warn('[LiveTrackingMap] Error fetching route:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Transporter stale location status check
  const staleStatus = transporterLocation?.updatedAt
    ? checkLocationStale(transporterLocation.updatedAt, 5)
    : null;

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50" style={{ height }}>
        <LeafletMapInner
          origin={origin}
          destination={destination}
          transporterLocation={transporterLocation}
          geometry={routeData?.geometry}
          height={height}
        />

        {/* Transporter Live / Stale Overlay Badge */}
        {transporterLocation && (
          <div
            className={`absolute top-3 left-3 z-[400] flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md ${
              staleStatus?.isStale
                ? 'bg-amber-600/90 text-white'
                : 'bg-emerald-600/90 text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                staleStatus?.isStale ? 'bg-amber-200' : 'bg-white animate-pulse'
              }`}
            />
            <Navigation className="w-3.5 h-3.5" />
            <span>
              {staleStatus?.isStale
                ? `अंतिम अपडेट: ${staleStatus.timeAgoText}`
                : 'लाइव ट्रांसपोर्टर'}
            </span>
          </div>
        )}
      </div>

      {/* Route Info Bar */}
      {showEta && (
        <div className="grid grid-cols-3 gap-3">
          {/* Pickup */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">पिकअप</p>
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{origin.address || origin.label}</p>
            </div>
          </div>

          {/* ETA / Distance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <button
              onClick={fetchRoute}
              disabled={isLoadingRoute}
              className="mb-1 focus:outline-none"
              title="रीफ्रेश करें"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoadingRoute ? 'animate-spin text-emerald-600' : 'hover:text-emerald-600'}`} />
            </button>

            {isLoadingRoute ? (
              <div className="w-12 h-4 bg-slate-200 rounded animate-pulse" />
            ) : routeData ? (
              routeData.routeAvailable && routeData.durationMinutes !== null ? (
                <>
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {routeData.durationMinutes < 60
                      ? `${routeData.durationMinutes} मि`
                      : `${Math.floor(routeData.durationMinutes / 60)}घं ${routeData.durationMinutes % 60}मि`}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">{routeData.distanceKm} km</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-amber-700 leading-tight flex items-center gap-1 justify-center">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    लगभग दूरी
                  </p>
                  <p className="text-xs font-black text-slate-900">{routeData.distanceKm} km</p>
                  <p className="text-[9px] text-slate-400 font-medium">रूट समय अनुपलब्ध</p>
                </>
              )
            ) : (
              <p className="text-xs text-slate-400 font-semibold">गणना जारी...</p>
            )}
          </div>

          {/* Destination */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 justify-end text-right">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">डिलीवरी</p>
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{destination.address || destination.label}</p>
            </div>
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};
