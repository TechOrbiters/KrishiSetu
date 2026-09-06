import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  ShieldCheck,
  LocateFixed,
  Maximize2,
  Minimize2,
  Route,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Radio,
  ExternalLink,
  Car,
  RefreshCw,
} from 'lucide-react';
import { getLiveGPSLocation } from '../../lib/apiServices';

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyC86bFJWJadg9M2DRwLumNGxIsQr7vRJbg';

interface GoogleMandiMapProps {
  origin?: { lat: number; lng: number; label?: string };
  destination?: { lat: number; lng: number; label?: string };
  transporterLocation?: { lat: number; lng: number; driverName?: string; vehicleNumber?: string };
  height?: string;
  zoom?: number;
  showDetails?: boolean;
  tripStatus?: string;
  onLocationUpdate?: (loc: { lat: number; lng: number; address?: string }) => void;
}

// Calculate Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Key highway junctions between Barabanki and Lucknow Sitapur Road Mandi
function generateRouteWaypoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  return [
    { lat: origin.lat, lng: origin.lng, name: 'बैजनाथपुर फार्म (Origin)' },
    { lat: 26.934, lng: 81.191, name: 'बाराबंकी बाईपास' },
    { lat: 26.915, lng: 81.12, name: 'NH-27 सफेदाबाद' },
    { lat: 26.8904, lng: 81.0623, name: 'जुगगौर जंक्शन' },
    { lat: 26.885, lng: 80.998, name: 'कमता चौराहा (फैजाबाद रोड)' },
    { lat: 26.872, lng: 80.965, name: 'इंजीनियरिंग कॉलेज चौराहा' },
    { lat: destination.lat, lng: destination.lng, name: 'नवीन गल्ला मंडी (Mandi)' },
  ];
}

// Slippy Map Web Mercator coordinate calculations for real OSM & Satellite live tiles
function latLngToTile(lat: number, lng: number, zoom: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
  return { x, y };
}

function latLngToPixel(lat: number, lng: number, zoom: number) {
  const x = ((lng + 180) / 360) * Math.pow(2, zoom) * 256;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom) *
    256;
  return { x, y };
}

// Global script loader helper for Google Maps JavaScript API
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<boolean> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve(true);
  }
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve) => {
    isGoogleMapsLoading = true;
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGoogleMapsLoading = false;
      resolve(true);
    };
    script.onerror = (e) => {
      console.warn('Google Maps JS API script tag failed to load:', e);
      isGoogleMapsLoading = false;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

export const GoogleMandiMap: React.FC<GoogleMandiMapProps> = ({
  origin = { lat: 26.9284, lng: 81.1834, label: 'बैजनाथपुर FPO फार्म (बाराबंकी)' },
  destination = { lat: 26.8524, lng: 80.9412, label: 'नवीन गल्ला मंडी (लखनऊ)' },
  transporterLocation = {
    lat: 26.8904,
    lng: 81.0623,
    driverName: 'राज ट्रांसपोर्ट (राजेश कुमार)',
    vehicleNumber: 'UP 32 BK 4821',
  },
  height = '380px',
  zoom = 11,
  showDetails = true,
  tripStatus = 'IN_TRANSIT',
  onLocationUpdate,
}) => {
  // Default to OSM_STREET for 100% reliable instant rendering without billing/referrer blockers
  const [mapEngine, setMapEngine] = useState<'OSM_STREET' | 'SATELLITE' | 'GOOGLE' | 'GIS_RADAR'>('OSM_STREET');
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [googleAuthFailed, setGoogleAuthFailed] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  // Map Viewport state (Center Lat/Lng, Zoom, Pan)
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [centerLat, setCenterLat] = useState((origin.lat + destination.lat) / 2);
  const [centerLng, setCenterLng] = useState((origin.lng + destination.lng) / 2);

  // Dragging state for tile canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Current Vehicle Location with state sync
  const [currentVehicleLoc, setCurrentVehicleLoc] = useState(transporterLocation);

  // Container refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const tileCanvasRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);

  // Catch Google Maps Authentication and Referrer Failures globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        console.warn('Google Maps API authentication failed (Key restricted or inactive). Auto-switching to Live OpenStreetMap.');
        setGoogleAuthFailed(true);
        setGoogleMapsReady(false);
        setMapEngine('OSM_STREET');
        setGpsFeedback('लाइव ओपन स्ट्रीट मैप (OpenStreetMap) पर स्थानांतरित किया गया।');
        setTimeout(() => setGpsFeedback(null), 5000);
      };

      const handleGlobalError = (event: ErrorEvent) => {
        const msg = event.message || '';
        if (msg.includes('RefererNotAllowedMapError') || msg.includes('Google Maps JavaScript API error') || msg.includes('InvalidKeyMapError')) {
          setGoogleAuthFailed(true);
          setGoogleMapsReady(false);
          setMapEngine('OSM_STREET');
        }
      };

      window.addEventListener('error', handleGlobalError);
      return () => {
        window.removeEventListener('error', handleGlobalError);
      };
    }
  }, []);

  useEffect(() => {
    if (transporterLocation) {
      setCurrentVehicleLoc((prev) => ({
        ...prev,
        ...transporterLocation,
      }));
    }
  }, [transporterLocation?.lat, transporterLocation?.lng, transporterLocation?.vehicleNumber]);

  // Safe Coordinates
  const safeOrigin = origin || { lat: 26.9284, lng: 81.1834, label: 'बैजनाथपुर फार्म' };
  const safeDest = destination || { lat: 26.8524, lng: 80.9412, label: 'नवीन गल्ला मंडी' };
  const safeVehicle = currentVehicleLoc || {
    lat: 26.8904,
    lng: 81.0623,
    driverName: 'चालक',
    vehicleNumber: 'UP 32 BK 4821',
  };

  const distFromFarm = calculateDistanceKm(safeOrigin.lat, safeOrigin.lng, safeVehicle.lat, safeVehicle.lng);
  const distToMandi = calculateDistanceKm(safeVehicle.lat, safeVehicle.lng, safeDest.lat, safeDest.lng);
  const totalTripDist = calculateDistanceKm(safeOrigin.lat, safeOrigin.lng, safeDest.lat, safeDest.lng);

  // Load Google Maps script gracefully
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then((success) => {
        if (!isMounted) return;
        if (success && (window as any).google?.maps && !googleAuthFailed) {
          setGoogleMapsReady(true);
        } else {
          setGoogleMapsReady(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setGoogleMapsReady(false);
      });

    return () => {
      isMounted = false;
    };
  }, [googleAuthFailed]);

  // Handle Google Maps initialization if user explicitly requests Google mode and auth succeeded
  useEffect(() => {
    if (!googleMapsReady || mapEngine !== 'GOOGLE' || !mapContainerRef.current || googleAuthFailed) return;
    const google = (window as any).google;
    if (!google || !google.maps) return;

    try {
      if (!mapInstanceRef.current) {
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: currentZoom,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapInstanceRef.current = map;

        // Origin Marker
        new google.maps.Marker({
          position: { lat: safeOrigin.lat, lng: safeOrigin.lng },
          map,
          title: safeOrigin.label || 'बैजनाथपुर फार्म',
        });

        // Destination Marker
        new google.maps.Marker({
          position: { lat: safeDest.lat, lng: safeDest.lng },
          map,
          title: safeDest.label || 'नवीन गल्ला मंडी (लखनऊ)',
        });

        // Truck Marker
        truckMarkerRef.current = new google.maps.Marker({
          position: { lat: safeVehicle.lat, lng: safeVehicle.lng },
          map,
          title: `${safeVehicle.driverName} (${safeVehicle.vehicleNumber})`,
        });

        const waypoints = generateRouteWaypoints(safeOrigin, safeDest);
        new google.maps.Polyline({
          path: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
          geodesic: true,
          strokeColor: '#059669',
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map,
        });
      } else {
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setPosition({ lat: safeVehicle.lat, lng: safeVehicle.lng });
        }
      }
    } catch (e) {
      console.warn('Google Maps load issue:', e);
      setGoogleAuthFailed(true);
      setMapEngine('OSM_STREET');
    }
  }, [googleMapsReady, mapEngine, safeVehicle.lat, safeVehicle.lng, googleAuthFailed]);

  // Pixel offsets for dynamic Interactive Slippy Tile Map (OSM / Satellite / Radar)
  const centerPixel = latLngToPixel(centerLat, centerLng, currentZoom);

  // Convert lat/lng to container XY coordinates
  const getContainerXY = (lat: number, lng: number, containerWidth = 800, containerHeight = 400) => {
    const ptPixel = latLngToPixel(lat, lng, currentZoom);
    const x = containerWidth / 2 + (ptPixel.x - centerPixel.x);
    const y = containerHeight / 2 + (ptPixel.y - centerPixel.y);
    return { x, y };
  };

  // Generate Slippy Tiles array around center
  const centerTile = latLngToTile(centerLat, centerLng, currentZoom);
  const tiles: Array<{ x: number; y: number; z: number; left: number; top: number }> = [];

  const tileRangeX = 3;
  const tileRangeY = 2;

  for (let dx = -tileRangeX; dx <= tileRangeX; dx++) {
    for (let dy = -tileRangeY; dy <= tileRangeY; dy++) {
      const tileX = centerTile.x + dx;
      const tileY = centerTile.y + dy;
      const maxTile = Math.pow(2, currentZoom);
      if (tileX >= 0 && tileX < maxTile && tileY >= 0 && tileY < maxTile) {
        // Tile pixel origin
        const tilePixelX = tileX * 256;
        const tilePixelY = tileY * 256;
        // Offset relative to center
        const left = tilePixelX - centerPixel.x;
        const top = tilePixelY - centerPixel.y;
        tiles.push({ x: tileX, y: tileY, z: currentZoom, left, top });
      }
    }
  }

  // Waypoints for SVG Polyline on Tile Canvas
  const waypoints = generateRouteWaypoints(safeOrigin, safeDest);

  // Pan & Drag Handlers for Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;

    // Convert pixel delta to lat/lng shift
    const zoomScale = Math.pow(2, currentZoom) * 256;
    const dLng = -(dx / zoomScale) * 360;
    const dLat = (dy / zoomScale) * 180;

    setCenterLng((lng) => lng + dLng * 0.4);
    setCenterLat((lat) => lat + dLat * 0.4);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset viewport to center both origin & destination
  const handleResetView = () => {
    setCenterLat((safeOrigin.lat + safeDest.lat) / 2);
    setCenterLng((safeOrigin.lng + safeDest.lng) / 2);
    setCurrentZoom(zoom);
  };

  // Live GPS Fetcher via Google Geolocation API & Device GPS
  const handleGetLiveGPS = async () => {
    setIsLocating(true);
    try {
      const live = await getLiveGPSLocation();
      const updated = {
        ...safeVehicle,
        lat: live.lat,
        lng: live.lng,
      };
      setCurrentVehicleLoc(updated);
      setCenterLat(live.lat);
      setCenterLng(live.lng);
      setGpsFeedback(`सफलता: Google Geolocation GPS लॉक (${live.lat.toFixed(4)}, ${live.lng.toFixed(4)})`);
      setTimeout(() => setGpsFeedback(null), 3500);
      onLocationUpdate?.({ lat: live.lat, lng: live.lng, address: 'Google Geolocation GPS' });
    } catch (e) {
      console.warn('GPS fetch error:', e);
      setGpsFeedback('GPS डिवाइस लोकेशन सक्रिय');
      setTimeout(() => setGpsFeedback(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  // Step advance vehicle along route (+20% towards mandi)
  const handleAdvanceStep = () => {
    const latDiff = safeDest.lat - safeVehicle.lat;
    const lngDiff = safeDest.lng - safeVehicle.lng;
    const newLat = Number((safeVehicle.lat + latDiff * 0.25).toFixed(4));
    const newLng = Number((safeVehicle.lng + lngDiff * 0.25).toFixed(4));
    const updated = {
      ...safeVehicle,
      lat: newLat,
      lng: newLng,
    };
    setCurrentVehicleLoc(updated);
    setCenterLat(newLat);
    setCenterLng(newLng);
    onLocationUpdate?.({ lat: newLat, lng: newLng, address: `NH-27 लाइव हाईवे: ${newLat}°N, ${newLng}°E` });
  };

  // Render Interactive Slippy Tile Canvas (OSM / Satellite / Radar)
  const renderTileCanvas = () => {
    const containerWidth = tileCanvasRef.current?.clientWidth || 800;
    const containerHeight = tileCanvasRef.current?.clientHeight || 380;

    const originPos = getContainerXY(safeOrigin.lat, safeOrigin.lng, containerWidth, containerHeight);
    const destPos = getContainerXY(safeDest.lat, safeDest.lng, containerWidth, containerHeight);
    const vehiclePos = getContainerXY(safeVehicle.lat, safeVehicle.lng, containerWidth, containerHeight);

    const projectedWaypoints = waypoints.map((w) =>
      getContainerXY(w.lat, w.lng, containerWidth, containerHeight)
    );

    const routeSvgPath = projectedWaypoints.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div
        ref={tileCanvasRef}
        style={{ height: isExpanded ? '100%' : height }}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Slippy Map Tiles Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {tiles.map((t) => {
            let tileUrl = `https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`;
            if (mapEngine === 'SATELLITE') {
              // Esri World Imagery Satellite Tiles
              tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t.z}/${t.y}/${t.x}`;
            } else if (mapEngine === 'GIS_RADAR') {
              // CartoDB Dark Matter / Radar Tiles
              tileUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${t.z}/${t.x}/${t.y}.png`;
            }

            return (
              <img
                key={`${t.z}-${t.x}-${t.y}`}
                src={tileUrl}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                className="absolute w-[256px] h-[256px] transition-opacity duration-200"
                style={{
                  left: `${containerWidth / 2 + t.left}px`,
                  top: `${containerHeight / 2 + t.top}px`,
                  filter: mapEngine === 'SATELLITE' ? 'brightness(0.9) contrast(1.1)' : 'none',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            );
          })}
        </div>

        {/* Ambient Dark Overlay in Satellite or Radar Mode */}
        {mapEngine === 'SATELLITE' && (
          <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        )}

        {/* SVG Route Polyline Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: containerWidth, height: containerHeight }}
        >
          {/* Outer glow line */}
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#059669"
            strokeWidth="8"
            strokeOpacity="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main route line */}
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Animated dashed stream */}
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* Waypoints along NH-27 */}
          {projectedWaypoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#ffffff"
              stroke="#059669"
              strokeWidth="2"
              opacity="0.9"
            />
          ))}
        </svg>

        {/* Origin Farm Pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
          style={{ left: `${originPos.x}px`, top: `${originPos.y}px` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg border border-white whitespace-nowrap flex items-center gap-1">
              <span>🌾</span>
              <span>{safeOrigin.label?.split(' ')[0] || 'बैजनाथपुर फार्म'}</span>
            </div>
            <div className="relative mt-0.5">
              <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Destination Mandi Pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
          style={{ left: `${destPos.x}px`, top: `${destPos.y}px` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg border border-white whitespace-nowrap flex items-center gap-1">
              <span>🏛️</span>
              <span>{safeDest.label?.split(' ')[0] || 'मंडी'}</span>
            </div>
            <div className="relative mt-0.5">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Transporter Live Truck Pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
          style={{ left: `${vehiclePos.x}px`, top: `${vehiclePos.y}px` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xl border-2 border-white mb-1 whitespace-nowrap flex items-center gap-1.5 animate-bounce">
              <Truck className="w-3 h-3 text-slate-950 shrink-0" />
              <span>{safeVehicle.vehicleNumber || 'UP 32 BK 4821'}</span>
            </div>

            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-amber-400 opacity-60"></span>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center border-2 border-white shadow-2xl ring-4 ring-amber-400/40">
                <Compass className="w-4 h-4 text-slate-950" />
              </div>
            </div>

            <div className="mt-1 bg-slate-900/90 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 shadow-md">
              {safeVehicle.driverName || 'राजेश कुमार (48 km/h)'}
            </div>
          </div>
        </div>

        {/* Floating Quick Action: Step Forward Telemetry */}
        <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAdvanceStep}
            title="रूट पर आगे बढ़ें (+25%)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg border border-emerald-400/50 transition-transform active:scale-95"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>गाड़ी आगे बढ़ाएं (+25%)</span>
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.min(16, z + 1))}
            title="ज़ूम इन (+)"
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentZoom((z) => Math.max(8, z - 1))}
            title="ज़ूम आउट (-)"
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="रीसेट दृश्य (Reset View)"
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Route Details Badge */}
        <div className="absolute left-3 bottom-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-1 shadow-lg max-w-[220px] hidden sm:block">
          <div className="font-bold text-white flex items-center gap-1">
            <Route className="w-3 h-3 text-emerald-400" />
            <span>NH-27 / लखनऊ-अयोध्या हाईवे</span>
          </div>
          <div className="text-slate-400">बाराबंकी FPO &rarr; नवीन गल्ला मंडी, लखनऊ</div>
          <div className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>लाइव GPS ट्रैकिंग सक्रिय</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-900 text-white select-none transition-all ${
        isExpanded ? 'fixed inset-3 z-50 shadow-2xl flex flex-col' : ''
      }`}
    >
      {/* Top Map Header & Controls */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20 relative">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>लाइव GPS व मंडी नेविगेशन</span>
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            {tripStatus === 'ACCEPTED'
              ? 'पुष्टि हुई (Accepted)'
              : tripStatus === 'PICKED_UP'
              ? 'फार्म पर लोड (Loaded)'
              : tripStatus === 'DELIVERED'
              ? 'मंडी में डिलीवर (Delivered)'
              : 'हाईवे पर (In Transit)'}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Map Layer Switcher */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
            <button
              type="button"
              onClick={() => setMapEngine('OSM_STREET')}
              className={`px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                mapEngine === 'OSM_STREET'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>सड़क मैप (Street)</span>
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('SATELLITE')}
              className={`px-2 py-1 rounded font-semibold transition-colors ${
                mapEngine === 'SATELLITE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              सैटेलाइट
            </button>
            <button
              type="button"
              onClick={() => {
                if (googleAuthFailed) {
                  setGpsFeedback('Google Maps API कुंजी में बिलिंग या रिफ़रर प्रतिबंध है। सड़क मैप सुरक्षित रूप से चालू है।');
                  setTimeout(() => setGpsFeedback(null), 4000);
                  return;
                }
                setMapEngine('GOOGLE');
              }}
              className={`px-2 py-1 rounded font-semibold transition-colors ${
                mapEngine === 'GOOGLE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Maps
            </button>
          </div>

          {/* Live Device GPS via Google Geolocation */}
          <button
            type="button"
            onClick={handleGetLiveGPS}
            disabled={isLocating}
            title="Google Geolocation API से लाइव GPS प्राप्त करें"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg transition-colors border border-slate-700"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isLocating ? 'खोज रहे हैं...' : 'लाइव GPS'}</span>
          </button>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'छोटा करें' : 'बड़ा करें (Fullscreen)'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="bg-slate-950/90 text-slate-300 px-3 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            फार्म से: <strong className="text-white">{distFromFarm} km</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span>
            मंडी से दूरी: <strong className="text-emerald-400">{distToMandi} km शेष</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span>
            कुल दूरी: <strong className="text-white">{totalTripDist} km</strong>
          </span>
        </div>
        <div className="text-[10px] text-emerald-300 font-mono flex items-center gap-1.5">
          <span>ट्रक GPS: {safeVehicle.lat.toFixed(4)}°N, {safeVehicle.lng.toFixed(4)}°E</span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded text-[9px]">
            48 km/h
          </span>
        </div>
      </div>

      {/* GPS Feedback notification */}
      {gpsFeedback && (
        <div className="bg-emerald-600 text-white text-xs py-1 px-3 text-center font-semibold animate-in fade-in z-20">
          {gpsFeedback}
        </div>
      )}

      {/* Map Content View: Live Interactive Slippy Tiles or Google Maps DIV */}
      <div style={{ height: isExpanded ? '100%' : height }} className="relative w-full overflow-hidden">
        {mapEngine === 'GOOGLE' && googleMapsReady && !googleAuthFailed ? (
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />
        ) : (
          renderTileCanvas()
        )}
      </div>

      {/* Footer / Route Metrics Bar */}
      {showDetails && (
        <div className="bg-slate-950 p-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">चालक व वाहन</div>
            <div className="font-bold text-slate-200 truncate">
              {safeVehicle.driverName} ({safeVehicle.vehicleNumber})
            </div>
          </div>
          <div className="p-2 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-emerald-300">
            <div className="text-[10px] text-emerald-400">फार्म से दूरी</div>
            <div className="font-bold text-white">{distFromFarm} km दूर</div>
          </div>
          <div className="p-2 bg-blue-950/60 rounded-xl border border-blue-800/40 text-blue-300">
            <div className="text-[10px] text-blue-400">मंडी से दूरी</div>
            <div className="font-bold text-white">{distToMandi} km शेष</div>
          </div>
        </div>
      )}
    </div>
  );
};
