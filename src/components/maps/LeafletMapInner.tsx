'use client';

/**
 * KRISHISETU — Leaflet Map Renderer (Pure Client-Side)
 * Handles visual map state ONLY: map instance, OpenStreetMap tiles, markers, route polyline, and viewport bounds.
 * Contains ZERO business logic or freshness decisions.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng, GeoJSONGeometry } from '@/lib/maps/types';
import { getMapTileConfig } from '@/lib/maps/provider';

export interface LeafletMapInnerProps {
  origin: LatLng & { label?: string };
  destination: LatLng & { label?: string };
  transporterLocation?: LatLng;
  geometry?: GeoJSONGeometry | null;
  height?: string;
}

export const LeafletMapInner: React.FC<LeafletMapInnerProps> = ({
  origin,
  destination,
  transporterLocation,
  geometry,
  height = '280px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent duplicate map initialization
    if (!mapRef.current) {
      const tileConfig = getMapTileConfig();
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([origin.lat, origin.lng], 10);

      L.tileLayer(tileConfig.tileUrl, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear existing markers & polyline on update
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const bounds: L.LatLngExpression[] = [];

    // 1. Pickup Marker (Emerald Pin)
    const pickupIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="background-color: #059669; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const pickupMarker = L.marker([origin.lat, origin.lng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>पिकअप:</b> ${origin.label || 'Origin'}`);
    markersRef.current.push(pickupMarker);
    bounds.push([origin.lat, origin.lng]);

    // 2. Destination Marker (Red Pin)
    const destIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="background-color: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>डिलीवरी:</b> ${destination.label || 'Destination'}`);
    markersRef.current.push(destMarker);
    bounds.push([destination.lat, destination.lng]);

    // 3. Transporter Marker (Live Location if available)
    if (transporterLocation) {
      const truckIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: #0284c7; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.5);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const truckMarker = L.marker([transporterLocation.lat, transporterLocation.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<b>लाइव ट्रांसपोर्टर</b>`);
      markersRef.current.push(truckMarker);
      bounds.push([transporterLocation.lat, transporterLocation.lng]);
    }

    // 4. Draw Route Polyline from OSRM GeoJSON geometry
    if (geometry && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const latLngs: L.LatLngExpression[] = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const polyline = L.polyline(latLngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
    } else if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [35, 35] });
    }

    return () => {
      // Strict unmount cleanup
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, transporterLocation?.lat, transporterLocation?.lng, geometry]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200"
      style={{ height, minHeight: '220px' }}
    />
  );
};
