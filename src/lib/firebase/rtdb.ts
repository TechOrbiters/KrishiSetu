import { ref, set, onValue, off, update } from 'firebase/database';
import { firebaseRtdb } from './client';

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  heading?: number;
  speed_kmh?: number;
  updated_at: number;
}

// 1. Update Shipment Location (Transporter Write)
export async function updateShipmentLocation(
  shipmentId: string,
  transporterId: string,
  lat: number,
  lng: number,
  heading: number = 0,
  speed: number = 0
) {
  if (!firebaseRtdb) return;
  const locationRef = ref(firebaseRtdb, `shipments/${shipmentId}/location`);
  const payload: LocationTelemetry = {
    latitude: lat,
    longitude: lng,
    heading,
    speed_kmh: speed,
    updated_at: Date.now(),
  };
  await set(locationRef, payload);

  // Set Transporter UID metadata for security rules enforcement
  const metadataRef = ref(firebaseRtdb, `shipments/${shipmentId}/transporter_uid`);
  await set(metadataRef, transporterId);
}

// 2. Subscribe to Shipment Location Stream (Buyer / Farmer Read)
export function subscribeShipmentLocation(
  shipmentId: string,
  callback: (telemetry: LocationTelemetry | null) => void
) {
  if (!firebaseRtdb) return () => {};
  const locationRef = ref(firebaseRtdb, `shipments/${shipmentId}/location`);

  const unsubscribe = onValue(locationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return () => off(locationRef, 'value', unsubscribe);
}

// 3. Update Transporter Driver Availability Status
export async function updateTransporterAvailability(
  transporterId: string,
  isOnline: boolean,
  currentLat?: number,
  currentLng?: number
) {
  if (!firebaseRtdb) return;
  const driverRef = ref(firebaseRtdb, `transporters/${transporterId}`);
  await update(driverRef, {
    is_online: isOnline,
    latitude: currentLat,
    longitude: currentLng,
    updated_at: Date.now(),
  });
}
