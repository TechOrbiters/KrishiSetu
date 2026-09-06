'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TransporterPortal } from '@/components/transporter/TransporterPortal';
import { KrishiAIAssistantModal } from '@/components/common/KrishiAIAssistantModal';
import { LanguageProvider } from '@/context/LanguageContext';
import { initialTransporterTrips } from '@/data/mockData';
import { TransporterTrip } from '@/types';
import { getApiUrl, getAuthHeaders } from '@/lib/api/client';

function TransporterPortalInner() {
  const router = useRouter();
  const [availableTrips, setAvailableTrips] = useState<TransporterTrip[]>(initialTransporterTrips);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Sync role in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishi_active_role', 'TRANSPORTER');
    }
  }, []);

  // Sync live backend jobs/trips
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        const headers = await getAuthHeaders();
        const [jobsRes, tripsRes] = await Promise.all([
          fetch(getApiUrl('/api/transporters/jobs'), { headers }).then((r) => r.json()).catch(() => ({ jobs: [] })),
          fetch(getApiUrl('/api/transporters/trips'), { headers }).then((r) => r.json()).catch(() => ({ trips: [] })),
        ]);

        if (!isMounted) return;

        // Convert live backend jobs into TransporterTrip format if present
        const backendJobs: TransporterTrip[] = (jobsRes.jobs || []).map((j: any) => ({
          id: j.id,
          orderCode: j.order_code || `ORD-${j.id.slice(-6).toUpperCase()}`,
          produceName: j.produce_name || 'उपज (कृषि)',
          quantityKg: j.quantity_kg || 500,
          fpoName: j.farmer_name || 'किसान साथी (सत्यापित)',
          pickupLocation: j.pickup_location || 'लखनऊ ग्रामीण क्लस्टर',
          dropLocation: j.destination || 'नवीन गल्ला मंडी, लखनऊ',
          distanceKm: j.distance_km || 30,
          eta: j.eta || '1h 30m',
          fare: j.fare || 850,
          pickupWindowHours: 2,
          status: 'AVAILABLE',
          isBestMatch: (j.match_score || 80) >= 85,
          freshnessDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          freshnessSafe: true,
          pickupCoords: { lat: 26.9284, lng: 81.1834, label: j.pickup_location || 'फार्म पिकअप' },
          dropCoords: { lat: 26.8524, lng: 80.9412, label: j.destination || 'गल्ला मंडी' },
        }));

        // Convert live backend trips into TransporterTrip format
        const backendTrips: TransporterTrip[] = (tripsRes.trips || []).map((t: any) => ({
          id: t.id,
          orderCode: t.order_code || `ORD-${t.id.slice(-6).toUpperCase()}`,
          produceName: t.produce_name || 'आलू / टमाटर',
          quantityKg: t.quantity_kg || 500,
          fpoName: t.farmer_name || 'FPO संघ',
          pickupLocation: t.pickup_location || 'फार्म गेट',
          dropLocation: t.destination || 'मंडी गेट',
          distanceKm: t.distance_km || 35,
          eta: t.eta || '45 मिनट',
          fare: t.fare || 950,
          pickupWindowHours: 1,
          status: t.status === 'DELIVERED' ? 'DELIVERED' : t.status === 'IN_TRANSIT' ? 'IN_TRANSIT' : t.status === 'PICKED_UP' ? 'PICKED_UP' : 'ACCEPTED',
          isBestMatch: false,
          freshnessDeadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          freshnessSafe: true,
          pickupCoords: { lat: 26.9284, lng: 81.1834, label: t.pickup_location || 'फार्म' },
          dropCoords: { lat: 26.8524, lng: 80.9412, label: t.destination || 'मंडी' },
          currentLocation: {
            lat: t.current_lat || 26.8904,
            lng: t.current_lng || 81.0623,
            speedKmh: 45,
            address: 'NH-27 लखनऊ-अयोध्या हाईवे',
            lastUpdated: 'अभी-अभी',
          },
        }));

        if (backendJobs.length > 0 || backendTrips.length > 0) {
          setAvailableTrips((prev) => {
            const combined = [...backendTrips, ...backendJobs];
            // Merge with prototype trips, keeping unique IDs
            const existingIds = new Set(combined.map((c) => c.id));
            const remaining = prev.filter((p) => !existingIds.has(p.id));
            return [...combined, ...remaining];
          });
        }
      } catch (e) {
        // graceful fallback to initial mock trips
      }
    }
    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAcceptJob = async (tripId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl(`/api/transport/requests/${tripId}/accept`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ vehicle_type: 'Mini Truck' }),
      }).catch(() => {});
    } catch (e) {}

    setAvailableTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: 'ACCEPTED' as const } : t))
    );
  };

  const handleRejectJob = async (tripId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl(`/api/transport/requests/${tripId}/decline`), {
        method: 'POST',
        headers,
      }).catch(() => {});
    } catch (e) {}

    setAvailableTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  const handleUpdateTripStatus = async (tripId: string, status: TransporterTrip['status']) => {
    try {
      const headers = await getAuthHeaders();
      if (status === 'PICKED_UP') {
        await fetch(getApiUrl(`/api/shipments/${tripId}/pickup`), { method: 'POST', headers }).catch(() => {});
      } else if (status === 'IN_TRANSIT') {
        await fetch(getApiUrl(`/api/shipments/${tripId}/start`), { method: 'POST', headers }).catch(() => {});
      } else if (status === 'DELIVERED') {
        await fetch(getApiUrl(`/api/shipments/${tripId}/arrive`), { method: 'POST', headers }).catch(() => {});
        await fetch(getApiUrl(`/api/shipments/${tripId}/deliver`), {
          method: 'POST',
          headers,
          body: JSON.stringify({ confirmation_type: 'OTP', confirmation_code: '4821' }),
        }).catch(() => {});
      }
    } catch (e) {}

    setAvailableTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status } : t))
    );
  };

  const handleUpdateTripLocation = async (
    tripId: string,
    location: { lat: number; lng: number; speedKmh?: number; address?: string }
  ) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl(`/api/shipments/${tripId}/location`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ lat: location.lat, lng: location.lng, speed: location.speedKmh }),
      }).catch(() => {});
    } catch (e) {}

    setAvailableTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              currentLocation: {
                ...location,
                lastUpdated: 'अभी-अभी',
              },
            }
          : t
      )
    );
  };

  return (
    <>
      <TransporterPortal
        onBackToLanding={() => router.push('/')}
        availableTrips={availableTrips}
        setAvailableTrips={setAvailableTrips}
        onOpenKrishiAI={() => setIsAiModalOpen(true)}
        onAcceptJob={handleAcceptJob}
        onRejectJob={handleRejectJob}
        onUpdateTripStatus={handleUpdateTripStatus}
        onUpdateTripLocation={handleUpdateTripLocation}
      />

      <KrishiAIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        userRole="TRANSPORTER"
      />
    </>
  );
}

export default function TransporterPage() {
  return (
    <LanguageProvider>
      <TransporterPortalInner />
    </LanguageProvider>
  );
}
