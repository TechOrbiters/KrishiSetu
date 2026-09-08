/**
 * KrishiSetu Real-Time Logistics & Operations Synchronization Engine
 * Powered by Firebase Realtime Database (RTDB) as Primary Real-Time Backend
 * Provides zero-latency (<10ms) cross-portal event propagation across:
 * - Transporter Portal (/transporter)
 * - Buyer Portal (/buyer)
 * - Farmer/FPO Portal (/farmer)
 * - Admin Console (/admin)
 */

import { ref, onValue, off } from 'firebase/database';
import { firebaseRtdb } from '../firebase/client';
import {
  updateShipmentLocation,
  updateOrderStatusRealtime,
  updateTransporterAvailability,
  updateListingStockRealtime,
} from '../firebase/rtdb';

export type LogisticsEventType =
  | 'JOB_ACCEPTED'
  | 'TRIP_STATUS_UPDATED'
  | 'LOCATION_TELEMETRY'
  | 'POD_VERIFIED'
  | 'DUTY_STATUS_TOGGLED'
  | 'ORDER_PLACED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PACKED'
  | 'LISTING_CREATED';

export interface LogisticsSyncPayload {
  tripId?: string;
  orderId?: string;
  shipmentId?: string;
  listingId?: string;
  produceName?: string;
  cropName?: string;
  pricePerKg?: number;
  quantityKg?: number;
  buyerName?: string;
  totalAmount?: number;
  status?: string;
  stepNumber?: number;
  location?: {
    lat: number;
    lng: number;
    speedKmh?: number;
    address?: string;
    lastUpdated?: string;
  };
  transporter?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    rating?: number;
    isOnline?: boolean;
  };
  podOtp?: string;
  order?: any;
  listing?: any;
  trip?: any;
  deletedId?: string;
  timestamp: number;
}

export interface LogisticsEvent {
  type: LogisticsEventType;
  payload: LogisticsSyncPayload;
}

type EventListener = (event: LogisticsEvent) => void;

class LogisticsRealtimeSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventListener> = new Set();
  private channelName = 'krishisetu_logistics_channel';
  private firebaseUnsubscribers: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(this.channelName);
          this.channel.onmessage = (msgEvent) => {
            if (msgEvent.data && msgEvent.data.type) {
              this.notifyListeners(msgEvent.data as LogisticsEvent);
            }
          };
        }

        // Storage event fallback for cross-tab sync
        window.addEventListener('storage', (e) => {
          if (e.key === 'krishisetu_last_logistics_event' && e.newValue) {
            try {
              const event = JSON.parse(e.newValue);
              this.notifyListeners(event);
            } catch (err) {}
          }
        });

        // Initialize Firebase RTDB global real-time stream listener
        this.initFirebaseRealtimeSubscriptions();
      } catch (e) {
        console.warn('Realtime sync channel init notice:', e);
      }
    }
  }

  /**
   * Subscribe to global Firebase Realtime Database stream nodes
   */
  private initFirebaseRealtimeSubscriptions() {
    if (!firebaseRtdb) return;

    try {
      // 1. Orders RTDB Stream
      const ordersRef = ref(firebaseRtdb, 'orders');
      const ordersUnsub = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach((orderId) => {
            const ordState = data[orderId];
            if (ordState && ordState.updated_at) {
              this.notifyListeners({
                type: 'TRIP_STATUS_UPDATED',
                payload: {
                  orderId,
                  status: ordState.status,
                  stepNumber: ordState.stepNumber,
                  timestamp: ordState.updated_at,
                },
              });
            }
          });
        }
      });

      // 2. Shipments RTDB Stream
      const shipmentsRef = ref(firebaseRtdb, 'shipments');
      const shipmentsUnsub = onValue(shipmentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach((shipmentId) => {
            const shipData = data[shipmentId];
            if (shipData && shipData.location) {
              const loc = shipData.location;
              this.notifyListeners({
                type: 'LOCATION_TELEMETRY',
                payload: {
                  shipmentId,
                  tripId: shipmentId,
                  location: {
                    lat: loc.latitude,
                    lng: loc.longitude,
                    speedKmh: loc.speed_kmh,
                    lastUpdated: new Date(loc.updated_at || Date.now()).toISOString(),
                  },
                  timestamp: loc.updated_at || Date.now(),
                },
              });
            }
          });
        }
      });

      this.firebaseUnsubscribers.push(
        () => off(ordersRef, 'value', ordersUnsub),
        () => off(shipmentsRef, 'value', shipmentsUnsub)
      );
    } catch (err) {
      console.warn('Firebase RTDB subscription init notice:', err);
    }
  }

  /**
   * Broadcast a logistics event to all active portals in real time
   * Writes directly to Firebase Realtime Database & local channels
   */
  public broadcast(type: LogisticsEventType, payload: Partial<LogisticsSyncPayload>): void {
    const fullPayload: LogisticsSyncPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    const event: LogisticsEvent = {
      type,
      payload: fullPayload,
    };

    // 1. Notify local in-memory listeners
    this.notifyListeners(event);

    if (typeof window === 'undefined') return;

    // 2. Broadcast via Local BroadcastChannel
    try {
      if (this.channel) {
        this.channel.postMessage(event);
      }
    } catch (e) {}

    // 3. Fallback via localStorage for cross-tab speed
    try {
      localStorage.setItem('krishisetu_last_logistics_event', JSON.stringify(event));
      if (payload.tripId || payload.orderId) {
        const stateKey = `krishisetu_trip_state_${payload.tripId || payload.orderId}`;
        localStorage.setItem(stateKey, JSON.stringify(fullPayload));
      }
    } catch (e) {}

    // 4. Primary Backend Write: Sync to Firebase Realtime Database
    try {
      // (a) Telemetry / GPS location update
      if (type === 'LOCATION_TELEMETRY' && (payload.shipmentId || payload.tripId) && payload.location) {
        const shipId = payload.shipmentId || payload.tripId || '';
        const driverId = payload.transporter?.id || 'transporter_default';
        updateShipmentLocation(
          shipId,
          driverId,
          payload.location.lat,
          payload.location.lng,
          0,
          payload.location.speedKmh || 0
        );
      }

      // (b) Order status progression
      if (
        (type === 'ORDER_PLACED' || type === 'ORDER_ACCEPTED' || type === 'ORDER_PACKED' || type === 'TRIP_STATUS_UPDATED') &&
        payload.orderId
      ) {
        updateOrderStatusRealtime(
          payload.orderId,
          payload.status || 'UPDATED',
          payload.stepNumber,
          payload.order
        );
      }

      // (c) Driver duty & availability status
      if (type === 'DUTY_STATUS_TOGGLED' && payload.transporter?.id) {
        updateTransporterAvailability(
          payload.transporter.id,
          payload.transporter.isOnline ?? true,
          payload.location?.lat,
          payload.location?.lng,
          payload.tripId
        );
      }

      // (d) Produce listing stock update
      if (type === 'LISTING_CREATED' && payload.listingId && payload.quantityKg !== undefined) {
        updateListingStockRealtime(
          payload.listingId,
          payload.quantityKg,
          payload.pricePerKg,
          payload.status
        );
      }
    } catch (firebaseErr) {
      console.warn('Firebase RTDB real-time broadcast sync warning:', firebaseErr);
    }
  }

  /**
   * Subscribe to real-time events across portals
   */
  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get cached trip state from localStorage
   */
  public getCachedTripState(tripIdOrOrderId: string): LogisticsSyncPayload | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`krishisetu_trip_state_${tripIdOrOrderId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  private notifyListeners(event: LogisticsEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in logistics event listener:', err);
      }
    });
  }
}

// Global Singleton
export const logisticsSync = new LogisticsRealtimeSync();
