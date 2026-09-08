import { ref, set, onValue, off, update, push } from 'firebase/database';
import { firebaseRtdb } from './client';

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  heading?: number;
  speed_kmh?: number;
  updated_at: number;
}

export interface OrderRealtimeState {
  orderId: string;
  status: string;
  stepNumber?: number;
  updated_at: number;
  metadata?: Record<string, any>;
}

export interface ListingRealtimeState {
  listingId: string;
  availableQtyKg: number;
  pricePerKg?: number;
  status: string;
  updated_at: number;
}

export interface TransporterRealtimeState {
  transporterId: string;
  is_online: boolean;
  latitude?: number;
  longitude?: number;
  active_trip_id?: string;
  updated_at: number;
}

export interface NotificationRealtimePayload {
  id?: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  timestamp: number;
}

/* ========================================================================= */
/* 1. SHIPMENT LOCATION & TELEMETRY STREAM                                   */
/* ========================================================================= */

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

  const metadataRef = ref(firebaseRtdb, `shipments/${shipmentId}/transporter_uid`);
  await set(metadataRef, transporterId);
}

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

/* ========================================================================= */
/* 2. ORDER STATUS REAL-TIME STREAM                                          */
/* ========================================================================= */

export async function updateOrderStatusRealtime(
  orderId: string,
  status: string,
  stepNumber?: number,
  metadata?: Record<string, any>
) {
  if (!firebaseRtdb) return;
  const orderRef = ref(firebaseRtdb, `orders/${orderId}`);
  const payload: OrderRealtimeState = {
    orderId,
    status,
    stepNumber,
    updated_at: Date.now(),
    metadata,
  };
  await update(orderRef, payload);
}

export function subscribeOrderRealtime(
  orderId: string,
  callback: (state: OrderRealtimeState | null) => void
) {
  if (!firebaseRtdb) return () => {};
  const orderRef = ref(firebaseRtdb, `orders/${orderId}`);

  const unsubscribe = onValue(orderRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return () => off(orderRef, 'value', unsubscribe);
}

export function subscribeAllOrdersRealtime(
  callback: (orders: Record<string, OrderRealtimeState>) => void
) {
  if (!firebaseRtdb) return () => {};
  const ordersRef = ref(firebaseRtdb, 'orders');

  const unsubscribe = onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(ordersRef, 'value', unsubscribe);
}

/* ========================================================================= */
/* 3. PRODUCE LISTINGS REAL-TIME STOCK STREAM                                */
/* ========================================================================= */

export async function updateListingStockRealtime(
  listingId: string,
  availableQtyKg: number,
  pricePerKg?: number,
  status?: string
) {
  if (!firebaseRtdb) return;
  const listingRef = ref(firebaseRtdb, `produceListings/${listingId}`);
  const payload: Partial<ListingRealtimeState> = {
    listingId,
    availableQtyKg,
    updated_at: Date.now(),
  };
  if (pricePerKg !== undefined) payload.pricePerKg = pricePerKg;
  if (status) payload.status = status;
  await update(listingRef, payload);
}

export function subscribeListingsRealtime(
  callback: (listings: Record<string, ListingRealtimeState>) => void
) {
  if (!firebaseRtdb) return () => {};
  const listingsRef = ref(firebaseRtdb, 'produceListings');

  const unsubscribe = onValue(listingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(listingsRef, 'value', unsubscribe);
}

/* ========================================================================= */
/* 4. TRANSPORTER DUTY & DRIVER RADAR REAL-TIME                              */
/* ========================================================================= */

export async function updateTransporterAvailability(
  transporterId: string,
  isOnline: boolean,
  currentLat?: number,
  currentLng?: number,
  activeTripId?: string
) {
  if (!firebaseRtdb) return;
  const driverRef = ref(firebaseRtdb, `transporters/${transporterId}`);
  await update(driverRef, {
    transporterId,
    is_online: isOnline,
    latitude: currentLat,
    longitude: currentLng,
    active_trip_id: activeTripId,
    updated_at: Date.now(),
  });
}

export function subscribeTransportersRealtime(
  callback: (transporters: Record<string, TransporterRealtimeState>) => void
) {
  if (!firebaseRtdb) return () => {};
  const driversRef = ref(firebaseRtdb, 'transporters');

  const unsubscribe = onValue(driversRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(driversRef, 'value', unsubscribe);
}

/* ========================================================================= */
/* 5. MARKET PRICES TICKER REAL-TIME STREAM                                  */
/* ========================================================================= */

export async function updateMarketPriceRealtime(cropKey: string, priceData: Record<string, any>) {
  if (!firebaseRtdb) return;
  const priceRef = ref(firebaseRtdb, `marketPrices/${cropKey}`);
  await update(priceRef, {
    ...priceData,
    updated_at: Date.now(),
  });
}

export function subscribeMarketPricesRealtime(
  callback: (prices: Record<string, any>) => void
) {
  if (!firebaseRtdb) return () => {};
  const pricesRef = ref(firebaseRtdb, 'marketPrices');

  const unsubscribe = onValue(pricesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(pricesRef, 'value', unsubscribe);
}

/* ========================================================================= */
/* 6. USER NOTIFICATIONS REAL-TIME STREAM                                    */
/* ========================================================================= */

export async function pushNotificationRealtime(
  userId: string,
  notification: Omit<NotificationRealtimePayload, 'timestamp'>
) {
  if (!firebaseRtdb) return;
  const userNotifRef = ref(firebaseRtdb, `notifications/${userId}`);
  const newRef = push(userNotifRef);
  await set(newRef, {
    id: newRef.key,
    ...notification,
    timestamp: Date.now(),
  });
}

export function subscribeNotificationsRealtime(
  userId: string,
  callback: (notifications: NotificationRealtimePayload[]) => void
) {
  if (!firebaseRtdb) return () => {};
  const userNotifRef = ref(firebaseRtdb, `notifications/${userId}`);

  const unsubscribe = onValue(userNotifRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      callback(list);
    } else {
      callback([]);
    }
  });

  return () => off(userNotifRef, 'value', unsubscribe);
}
