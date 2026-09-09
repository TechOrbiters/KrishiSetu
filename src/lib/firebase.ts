import {
  ref,
  onValue,
  off,
  set,
  update,
  remove,
  get,
} from 'firebase/database';
import { firebaseApp, firebaseAuth, firebaseRtdb } from './firebase/client';
import { supabaseClient } from './supabase/client';
import { logisticsSync } from './realtime/logisticsSync';
import {
  ProduceListing,
  Order,
  TransporterTrip,
  MarketPrice,
  FPOProfile,
  VerificationRequest,
  Dispute,
} from '../types';
import {
  initialMarketPrices,
  initialFPOs,
  initialVerifications,
  initialDisputes,
} from '../data/mockData';

// Re-export core instances
export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseRtdb;

// Backwards-compatible Error Handling stubs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  console.warn(`[RTDB Operation ${operationType}] Path: ${path}`, error);
}

// Dummy collection objects for legacy components that reference them
export const produceListingsCol = {} as any;
export const ordersCol = {} as any;
export const transporterTripsCol = {} as any;
export const marketPricesCol = {} as any;
export const fposCol = {} as any;
export const verificationsCol = {} as any;
export const disputesCol = {} as any;
export const usersCol = {} as any;

/* -------------------------------------------------------------------------- */
/* Realtime Subscriptions via Firebase Realtime Database (RTDB)                */
/* -------------------------------------------------------------------------- */

/**
 * Helper to convert RTDB snapshot object { id1: val1, id2: val2 } to Array
 */
function snapshotToArray<T extends { id?: string }>(val: any, initialDefaults: T[] = []): T[] {
  if (!val) return initialDefaults;
  if (Array.isArray(val)) {
    return val.filter(Boolean).map((item, idx) => ({
      id: item.id || `item_${idx}`,
      ...item,
    }));
  }
  if (typeof val === 'object') {
    return Object.keys(val).map((k) => ({
      id: k,
      ...val[k],
    }));
  }
  return initialDefaults;
}

export function subscribeProduceListings(
  onData: (listings: ProduceListing[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData([]);
    return () => {};
  }

  const listingsRef = ref(firebaseRtdb, 'produceListings');
  const listener = onValue(
    listingsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        onData([]);
      } else {
        const list = snapshotToArray<ProduceListing>(val, []);
        onData(list);
      }
    },
    (err) => {
      console.warn('Realtime ProduceListings subscription warning:', err);
      if (onError) onError(err);
      onData([]);
    }
  );

  return () => off(listingsRef, 'value', listener);
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData([]);
    return () => {};
  }

  const ordersRef = ref(firebaseRtdb, 'orders');
  const listener = onValue(
    ordersRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        onData([]);
      } else {
        const list = snapshotToArray<Order>(val, []);
        onData(list);
      }
    },
    (err) => {
      console.warn('Realtime Orders subscription warning:', err);
      if (onError) onError(err);
      onData([]);
    }
  );

  return () => off(ordersRef, 'value', listener);
}

export function subscribeTransporterTrips(
  onData: (trips: TransporterTrip[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData([]);
    return () => {};
  }

  const tripsRef = ref(firebaseRtdb, 'transporterTrips');
  const listener = onValue(
    tripsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        onData([]);
      } else {
        const list = snapshotToArray<TransporterTrip>(val, []);
        onData(list);
      }
    },
    (err) => {
      console.warn('Realtime TransporterTrips subscription warning:', err);
      if (onError) onError(err);
      onData([]);
    }
  );

  return () => off(tripsRef, 'value', listener);
}

export function subscribeMarketPrices(
  onData: (prices: MarketPrice[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData(initialMarketPrices);
    return () => {};
  }

  const pricesRef = ref(firebaseRtdb, 'marketPrices');
  const listener = onValue(
    pricesRef,
    (snapshot) => {
      const val = snapshot.val();
      const list = snapshotToArray<MarketPrice>(val, initialMarketPrices);
      onData(list);
    },
    (err) => {
      console.warn('Realtime MarketPrices subscription warning:', err);
      if (onError) onError(err);
      onData(initialMarketPrices);
    }
  );

  return () => off(pricesRef, 'value', listener);
}

export function subscribeFPOs(
  onData: (fpos: FPOProfile[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData(initialFPOs);
    return () => {};
  }

  const fposRef = ref(firebaseRtdb, 'fpos');
  const listener = onValue(
    fposRef,
    (snapshot) => {
      const val = snapshot.val();
      const list = snapshotToArray<FPOProfile>(val, initialFPOs);
      onData(list);
    },
    (err) => {
      console.warn('Realtime FPOs subscription warning:', err);
      if (onError) onError(err);
      onData(initialFPOs);
    }
  );

  return () => off(fposRef, 'value', listener);
}

export function subscribeVerifications(
  onData: (verifications: VerificationRequest[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData(initialVerifications);
    return () => {};
  }

  const verifRef = ref(firebaseRtdb, 'verifications');
  const listener = onValue(
    verifRef,
    (snapshot) => {
      const val = snapshot.val();
      const list = snapshotToArray<VerificationRequest>(val, initialVerifications);
      onData(list);
    },
    (err) => {
      console.warn('Realtime Verifications subscription warning:', err);
      if (onError) onError(err);
      onData(initialVerifications);
    }
  );

  return () => off(verifRef, 'value', listener);
}

export function subscribeDisputes(
  onData: (disputes: Dispute[]) => void,
  onError?: (err: Error) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') {
    onData(initialDisputes);
    return () => {};
  }

  const dispRef = ref(firebaseRtdb, 'disputes');
  const listener = onValue(
    dispRef,
    (snapshot) => {
      const val = snapshot.val();
      const list = snapshotToArray<Dispute>(val, initialDisputes);
      onData(list);
    },
    (err) => {
      console.warn('Realtime Disputes subscription warning:', err);
      if (onError) onError(err);
      onData(initialDisputes);
    }
  );

  return () => off(dispRef, 'value', listener);
}

export function subscribeBuyerProfile(
  id: string,
  onData: (data: any) => void,
  onError?: (err: Error) => void
) {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`kisan_buyer_profile_${id}`);
      if (local) onData(JSON.parse(local));
    } catch (e) {}
  }

  if (!firebaseRtdb || typeof window === 'undefined') return () => {};

  const profileRef = ref(firebaseRtdb, `users/${id}`);
  const listener = onValue(
    profileRef,
    (snap) => {
      const data = snap.val();
      if (data && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`kisan_buyer_profile_${id}`, JSON.stringify(data));
        } catch (e) {}
      }
      onData(data);
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  return () => off(profileRef, 'value', listener);
}

/* -------------------------------------------------------------------------- */
/* Realtime Mutations with Multi-Tier Storage (RTDB + Supabase + Local)        */
/* -------------------------------------------------------------------------- */

export async function createProduceListing(listing: Omit<ProduceListing, 'id'> & { id?: string }) {
  const customId = listing.id || `prod_${Date.now()}`;
  const dataToSave = {
    ...listing,
    id: customId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. RTDB instant broadcast
    if (firebaseRtdb) {
      await set(ref(firebaseRtdb, `produceListings/${customId}`), dataToSave);
    }

    // 2. Supabase persistent backup
    supabaseClient
      .from('produce_listings')
      .insert({
        crop_name: listing.cropHindi || listing.crop,
        category: 'Vegetables',
        total_quantity: listing.quantityKg,
        available_quantity: listing.quantityKg,
        price_per_kg: listing.pricePerKg,
        grade: listing.quality || 'A',
        location_name: listing.cultivationLocation,
        status: 'ACTIVE',
        images: listing.image ? [listing.image] : [],
        shelf_life_days: Math.round((listing.freshnessWindowHours || 48) / 24),
      })
      .then(() => {}, () => {});

    // 3. Zero-latency cross-tab event
    logisticsSync.broadcast('LISTING_CREATED', { listing: dataToSave });

    return customId;
  } catch (err) {
    console.error('Error creating produce listing in RTDB:', err);
    return customId;
  }
}

export async function updateProduceListing(id: string, updates: Partial<ProduceListing>) {
  try {
    if (firebaseRtdb) {
      await update(ref(firebaseRtdb, `produceListings/${id}`), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
    logisticsSync.broadcast('LISTING_CREATED', { listing: { id, ...updates } });
  } catch (err) {
    console.error('Error updating produce listing in RTDB:', err);
  }
}

export async function deleteProduceListing(id: string) {
  try {
    if (firebaseRtdb) {
      await remove(ref(firebaseRtdb, `produceListings/${id}`));
    }
    logisticsSync.broadcast('LISTING_CREATED', { deletedId: id });
  } catch (err) {
    console.error('Error deleting produce listing from RTDB:', err);
  }
}

export async function createOrder(order: Order) {
  const customId = order.id || `ord_${Date.now()}`;
  const orderData = {
    ...order,
    id: customId,
    createdAt: new Date().toISOString(),
  };

  // 1. Immediate localStorage cache for client instant recovery
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('kisan_buyer_orders');
      const parsed = local ? JSON.parse(local) : [];
      parsed.unshift(orderData);
      localStorage.setItem('kisan_buyer_orders', JSON.stringify(parsed));
    } catch (e) {}
  }

  try {
    // 2. Write to RTDB for instant real-time sync across portals
    if (firebaseRtdb) {
      await set(ref(firebaseRtdb, `orders/${customId}`), orderData);
    }

    // 4. Also record in Supabase
    supabaseClient
      .from('orders')
      .insert({
        order_number: order.orderCode,
        status: 'PLACED',
        total_amount: order.totalAmount,
        quantity: order.items[0]?.quantityKg || 50,
        unit_price: order.items[0]?.pricePerKg || 25,
      })
      .then(() => {}, () => {});

    // 5. Broadcast real-time logistics event
    logisticsSync.broadcast('ORDER_PLACED', {
      orderId: customId,
      order: orderData,
      timestamp: Date.now(),
    });

    return customId;
  } catch (err) {
    console.error('Error creating order in RTDB:', err);
    return customId;
  }
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  try {
    if (firebaseRtdb) {
      await update(ref(firebaseRtdb, `orders/${id}`), updates);
    }
    if (updates.status === 'ACCEPTED') {
      logisticsSync.broadcast('ORDER_ACCEPTED', { orderId: id, status: 'ACCEPTED', timestamp: Date.now() });
    } else if (updates.status === 'PACKED') {
      logisticsSync.broadcast('ORDER_PACKED', { orderId: id, status: 'PACKED', timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Error updating order in RTDB:', err);
  }
}

export async function updateTransporterTrip(id: string, updates: Partial<TransporterTrip>) {
  try {
    if (firebaseRtdb) {
      await update(ref(firebaseRtdb, `transporterTrips/${id}`), updates);

      // If status changed and orderCode is present, synchronize order status in RTDB
      if (updates.status && updates.orderCode) {
        const snap = await get(ref(firebaseRtdb, 'orders'));
        const ordersVal = snap.val();
        if (ordersVal) {
          for (const ordKey of Object.keys(ordersVal)) {
            const ord = ordersVal[ordKey];
            if (ord.orderCode === updates.orderCode) {
              let nextStatus = ord.status;
              if (updates.status === 'ACCEPTED') nextStatus = 'ACCEPTED';
              if (updates.status === 'PICKED_UP') nextStatus = 'PACKED';
              if (updates.status === 'IN_TRANSIT') nextStatus = 'IN_TRANSIT';
              if (updates.status === 'DELIVERED') nextStatus = 'DELIVERED';
              await update(ref(firebaseRtdb, `orders/${ordKey}`), { status: nextStatus });
            }
          }
        }
      }
    }

    logisticsSync.broadcast('TRIP_STATUS_UPDATED', {
      tripId: id,
      orderId: updates.orderCode,
      status: updates.status,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Error updating transporter trip in RTDB:', err);
  }
}

export async function updateTransporterLocation(
  tripId: string,
  location: { lat: number; lng: number; speedKmh?: number; address?: string; lastUpdated?: string }
) {
  try {
    const locData = {
      ...location,
      lastUpdated: location.lastUpdated || new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    if (firebaseRtdb) {
      await update(ref(firebaseRtdb, `transporterTrips/${tripId}`), {
        currentLocation: locData,
      });
      // Also update shipments telemetry endpoint for LiveTrackingMap
      await set(ref(firebaseRtdb, `shipments/${tripId}/location`), {
        latitude: location.lat,
        longitude: location.lng,
        speed_kmh: location.speedKmh || 40,
        updated_at: Date.now(),
      });
    }

    logisticsSync.broadcast('LOCATION_TELEMETRY', {
      tripId,
      location: locData,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Error updating transporter location in RTDB:', err);
  }
}

export function subscribeTransporterLocation(
  tripId: string,
  onData: (loc: { lat: number; lng: number; speedKmh?: number; address?: string; lastUpdated?: string }) => void
) {
  if (!firebaseRtdb || typeof window === 'undefined') return () => {};

  const locRef = ref(firebaseRtdb, `shipments/${tripId}/location`);
  const listener = onValue(locRef, (snap) => {
    const val = snap.val();
    if (val && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
      onData({
        lat: val.latitude,
        lng: val.longitude,
        speedKmh: val.speed_kmh || 35,
        address: 'हाईवे रूट',
        lastUpdated: 'अभी-अभी',
      });
    }
  });

  return () => off(locRef, 'value', listener);
}

export async function updateVerification(id: string, status: 'VERIFIED' | 'REJECTED') {
  if (firebaseRtdb) {
    await update(ref(firebaseRtdb, `verifications/${id}`), { status });
  }
}

export async function updateDispute(id: string, status: 'RESOLVED' | 'OPEN', resolution?: string) {
  if (firebaseRtdb) {
    await update(ref(firebaseRtdb, `disputes/${id}`), {
      status,
      ...(resolution ? { resolution } : {}),
    });
  }
}

export async function updateBuyerProfile(id: string, profile: any) {
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(`kisan_buyer_profile_${id}`);
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, ...profile, updatedAt: new Date().toISOString() };
      localStorage.setItem(`kisan_buyer_profile_${id}`, JSON.stringify(merged));
    } catch (e) {}
  }

  if (firebaseRtdb) {
    await update(ref(firebaseRtdb, `users/${id}`), {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  }
}

// --- Seed Initial Data into RTDB if Empty ---

export async function seedInitialDataIfEmpty(force = false) {
  if (!firebaseRtdb || !force) return;

  try {
    // Note: produceListings, orders, and transporterTrips are strictly populated by real farmer listings and buyer orders.
    // No mock data is seeded into produceListings, orders, or transporterTrips.

    const pSnap = await get(ref(firebaseRtdb, 'marketPrices'));
    if (force || !pSnap.exists() || !pSnap.val()) {
      const pricesMap: Record<string, any> = {};
      initialMarketPrices.forEach((p) => {
        pricesMap[p.id] = p;
      });
      await set(ref(firebaseRtdb, 'marketPrices'), pricesMap);
    }

    const fSnap = await get(ref(firebaseRtdb, 'fpos'));
    if (force || !fSnap.exists() || !fSnap.val()) {
      const fposMap: Record<string, any> = {};
      initialFPOs.forEach((f) => {
        fposMap[f.id] = f;
      });
      await set(ref(firebaseRtdb, 'fpos'), fposMap);
    }

    console.log('RTDB initial dataset confirmed and active.');
  } catch (err) {
    console.warn('Notice during initial RTDB seed check:', err);
  }
}
