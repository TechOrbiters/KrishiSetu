import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
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
  initialProduceListings,
  initialOrders,
  initialTransporterTrips,
  initialMarketPrices,
  initialFPOs,
  initialVerifications,
  initialDisputes,
} from '../data/mockData';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (using custom databaseId if configured)
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// --- Custom Error Handler for Firebase Integration Skill ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
}

// Collection References
export const produceListingsCol = collection(db, 'produceListings');
export const ordersCol = collection(db, 'orders');
export const transporterTripsCol = collection(db, 'transporterTrips');
export const marketPricesCol = collection(db, 'marketPrices');
export const fposCol = collection(db, 'fpos');
export const verificationsCol = collection(db, 'verifications');
export const disputesCol = collection(db, 'disputes');
export const usersCol = collection(db, 'users');

// --- Realtime Subscriptions ---

export function subscribeProduceListings(
  onData: (listings: ProduceListing[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    produceListingsCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: ProduceListing[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as ProduceListing);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime ProduceListings subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'produceListings');
    }
  );
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    ordersCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: Order[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Order);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime Orders subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'orders');
    }
  );
}

export function subscribeTransporterTrips(
  onData: (trips: TransporterTrip[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    transporterTripsCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: TransporterTrip[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as TransporterTrip);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime TransporterTrips subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'transporterTrips');
    }
  );
}

export function subscribeMarketPrices(
  onData: (prices: MarketPrice[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    marketPricesCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: MarketPrice[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as MarketPrice);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime MarketPrices subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'marketPrices');
    }
  );
}

export function subscribeFPOs(
  onData: (fpos: FPOProfile[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    fposCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: FPOProfile[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as FPOProfile);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime FPOs subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'fpos');
    }
  );
}

export function subscribeVerifications(
  onData: (verifications: VerificationRequest[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    verificationsCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: VerificationRequest[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as VerificationRequest);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime Verifications subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'verifications');
    }
  );
}

export function subscribeDisputes(
  onData: (disputes: Dispute[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    disputesCol,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: Dispute[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Dispute);
      });
      onData(items);
    },
    (err) => {
      console.error('Realtime Disputes subscription error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, 'disputes');
    }
  );
}

export function subscribeBuyerProfile(
  id: string,
  onData: (data: any) => void,
  onError?: (err: Error) => void
) {
  // 1. Immediately provide cached local data if available
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`kisan_buyer_profile_${id}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed) onData(parsed);
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Attempt Firestore realtime sync
  try {
    const docRef = doc(db, 'users', id);
    return onSnapshot(
      docRef,
      (d) => {
        if (d.exists()) {
          const data = d.data();
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`kisan_buyer_profile_${id}`, JSON.stringify(data));
            } catch (e) {}
          }
          onData(data);
        } else {
          onData(null);
        }
      },
      (err) => {
        console.warn('Realtime BuyerProfile subscription warning:', err.message);
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.GET, `users/${id}`);
      }
    );
  } catch (err: any) {
    console.warn('Firestore subscription not available, using local cache:', err.message);
    return () => {};
  }
}

// --- Realtime Mutations ---

export async function createProduceListing(listing: Omit<ProduceListing, 'id'> & { id?: string }) {
  const customId = listing.id || `prod-${Date.now()}`;
  const path = `produceListings/${customId}`;
  try {
    const docRef = doc(db, 'produceListings', customId);
    const dataToSave = {
      ...listing,
      id: customId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave);
    return customId;
  } catch (err) {
    console.error('Error creating produce listing in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateProduceListing(id: string, updates: Partial<ProduceListing>) {
  const path = `produceListings/${id}`;
  try {
    const docRef = doc(db, 'produceListings', id);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating produce listing in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProduceListing(id: string) {
  const path = `produceListings/${id}`;
  try {
    const docRef = doc(db, 'produceListings', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting produce listing from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function createOrder(order: Order) {
  const customId = order.id || `ord-${Date.now()}`;
  const path = `orders/${customId}`;
  
  // 1. Immediately cache in localStorage for client instant recovery
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('kisan_buyer_orders');
      const parsed = local ? JSON.parse(local) : [];
      parsed.unshift({ ...order, id: customId, createdAt: new Date().toISOString() });
      localStorage.setItem('kisan_buyer_orders', JSON.stringify(parsed));
    } catch (e) {}
  }

  try {
    const orderDocRef = doc(db, 'orders', customId);
    const orderData = {
      ...order,
      id: customId,
      createdAt: new Date().toISOString(),
    };
    
    // Protected with timeout so Firestore pending handshake never hangs the client
    await Promise.race([
      setDoc(orderDocRef, orderData, { merge: true }),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);

    // If order uses DELIVERY_PARTNER, automatically spawn a real-time Transporter Trip
    if (order.deliveryMethod === 'DELIVERY_PARTNER') {
      const tripId = `trip-${Date.now()}`;
      const tripDocRef = doc(db, 'transporterTrips', tripId);
      const tripData: TransporterTrip = {
        id: tripId,
        orderCode: order.orderCode,
        produceName: order.items[0]?.cropHindi || order.items[0]?.crop || 'कृषि उपज',
        quantityKg: order.items.reduce((sum, it) => sum + it.quantityKg, 0),
        fpoName: order.sellerName,
        pickupLocation: order.pickupLocation,
        dropLocation: order.dropLocation,
        distanceKm: order.distanceKm || 45,
        eta: order.eta || '3h 30m',
        fare: order.deliveryFee,
        pickupWindowHours: 4,
        status: 'AVAILABLE',
        isBestMatch: true,
        freshnessDeadline: '24 घंटे शेष',
        freshnessSafe: true,
        otp: Math.floor(1000 + Math.random() * 9000).toString(),
        temperature: 21.5,
      };
      
      Promise.race([
        setDoc(tripDocRef, tripData, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]).catch(() => {});
    }

    return customId;
  } catch (err) {
    console.warn('Warning creating order in Firestore (saved locally):', err);
    handleFirestoreError(err, OperationType.WRITE, path);
    return customId;
  }
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const path = `orders/${id}`;
  try {
    const docRef = doc(db, 'orders', id);
    await Promise.race([
      setDoc(docRef, updates, { merge: true }),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);
  } catch (err) {
    console.error('Error updating order in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTransporterTrip(id: string, updates: Partial<TransporterTrip>) {
  const path = `transporterTrips/${id}`;
  try {
    const docRef = doc(db, 'transporterTrips', id);
    await Promise.race([
      setDoc(docRef, updates, { merge: true }),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);

    // Synchronize order status if trip status changes
    if (updates.status && updates.orderCode) {
      const orderDocs = await getDocs(ordersCol);
      orderDocs.forEach(async (d) => {
        const orderData = d.data() as Order;
        if (orderData.orderCode === updates.orderCode) {
          let nextOrderStatus: Order['status'] = orderData.status;
          if (updates.status === 'ACCEPTED') nextOrderStatus = 'ACCEPTED';
          if (updates.status === 'PICKED_UP') nextOrderStatus = 'PACKED';
          if (updates.status === 'IN_TRANSIT') nextOrderStatus = 'IN_TRANSIT';
          if (updates.status === 'DELIVERED') nextOrderStatus = 'DELIVERED';

          await Promise.race([
            setDoc(
              doc(db, 'orders', d.id),
              {
                status: nextOrderStatus,
                ...(updates.status === 'DELIVERED' ? { deliveredAt: 'अभी-अभी' } : {}),
              },
              { merge: true }
            ),
            new Promise((resolve) => setTimeout(resolve, 1500))
          ]);
        }
      });
    }
  } catch (err) {
    console.error('Error updating transporter trip in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTransporterLocation(
  tripId: string,
  location: { lat: number; lng: number; speedKmh?: number; address?: string; lastUpdated?: string }
) {
  const path = `transporterTrips/${tripId}`;
  try {
    const docRef = doc(db, 'transporterTrips', tripId);
    await setDoc(
      docRef,
      {
        currentLocation: {
          ...location,
          lastUpdated: location.lastUpdated || new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating transporter location in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateVerification(id: string, status: 'VERIFIED' | 'REJECTED') {
  const path = `verifications/${id}`;
  try {
    const docRef = doc(db, 'verifications', id);
    await setDoc(docRef, { status }, { merge: true });
  } catch (err) {
    console.error('Error updating verification status in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateDispute(id: string, status: 'RESOLVED' | 'OPEN', resolution?: string) {
  const path = `disputes/${id}`;
  try {
    const docRef = doc(db, 'disputes', id);
    await setDoc(
      docRef,
      {
        status,
        ...(resolution ? { resolution } : {}),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating dispute in Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBuyerProfile(id: string, profile: any) {
  // 1. Immediately persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(`kisan_buyer_profile_${id}`);
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = {
        ...parsed,
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`kisan_buyer_profile_${id}`, JSON.stringify(merged));
    } catch (e) {}
  }

  // 2. Sync to Firestore
  const path = `users/${id}`;
  try {
    const docRef = doc(db, 'users', id);
    await setDoc(
      docRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('Warning updating buyer profile in Firestore (saved locally):', err.message);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- Seed Initial Data if Collections are Empty ---

export async function seedInitialDataIfEmpty(force = false) {
  try {
    // 1. Listings
    const listingsSnap = await getDocs(produceListingsCol);
    if (force || listingsSnap.empty) {
      console.log('Seeding initial produce listings to Firestore...');
      for (const item of initialProduceListings) {
        await setDoc(doc(db, 'produceListings', item.id), item);
      }
    }

    // 2. Orders
    const ordersSnap = await getDocs(ordersCol);
    if (force || ordersSnap.empty) {
      console.log('Seeding initial orders to Firestore...');
      for (const item of initialOrders) {
        await setDoc(doc(db, 'orders', item.id), item);
      }
    }

    // 3. Transporter Trips
    const tripsSnap = await getDocs(transporterTripsCol);
    if (force || tripsSnap.empty) {
      console.log('Seeding initial transporter trips to Firestore...');
      for (const item of initialTransporterTrips) {
        await setDoc(doc(db, 'transporterTrips', item.id), item);
      }
    }

    // 4. Market Prices
    const pricesSnap = await getDocs(marketPricesCol);
    if (force || pricesSnap.empty) {
      console.log('Seeding initial market prices to Firestore...');
      for (const item of initialMarketPrices) {
        await setDoc(doc(db, 'marketPrices', item.id), item);
      }
    }

    // 5. FPOs
    const fposSnap = await getDocs(fposCol);
    if (force || fposSnap.empty) {
      console.log('Seeding initial FPO profiles to Firestore...');
      for (const item of initialFPOs) {
        await setDoc(doc(db, 'fpos', item.id), item);
      }
    }

    // 6. Verifications
    const verifSnap = await getDocs(verificationsCol);
    if (force || verifSnap.empty) {
      console.log('Seeding initial verifications to Firestore...');
      for (const item of initialVerifications) {
        await setDoc(doc(db, 'verifications', item.id), item);
      }
    }

    // 7. Disputes
    const disputesSnap = await getDocs(disputesCol);
    if (force || disputesSnap.empty) {
      console.log('Seeding initial disputes to Firestore...');
      for (const item of initialDisputes) {
        await setDoc(doc(db, 'disputes', item.id), item);
      }
    }

    console.log('Firestore seed verification completed successfully.');
  } catch (err) {
    console.error('Error during initial Firestore seeding:', err);
  }
}
