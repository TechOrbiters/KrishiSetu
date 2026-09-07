import { Order, TransporterTrip, ProduceListing, OrderStatus } from '../types';
import {
  createOrder,
  updateOrder,
  updateTransporterTrip,
  updateTransporterLocation,
  subscribeOrders,
  subscribeTransporterTrips,
} from './firebase';
import { transitionOrderStatusApi, acceptTransporterTripApi } from './apiServices';
import { logisticsSync } from './realtime/logisticsSync';

export type OrderEventType = 'ORDER_PLACED' | 'ORDER_ACCEPTED_FARMER' | 'ORDER_PACKED' | 'JOB_ACCEPTED_TRANSPORTER' | 'TRIP_UPDATED' | 'ORDER_DELIVERED';

export interface GlobalOrderNotification {
  id: string;
  type: OrderEventType;
  title: string;
  message: string;
  orderCode: string;
  totalAmount?: number;
  produceName?: string;
  quantityKg?: number;
  buyerName?: string;
  sellerName?: string;
  driverName?: string;
  vehicleNumber?: string;
  timestamp: string;
  orderId?: string;
  tripId?: string;
}

type NotificationListener = (notification: GlobalOrderNotification) => void;

class GlobalOrderManager {
  private notificationListeners: Set<NotificationListener> = new Set();
  private prevOrdersMap: Map<string, Order> = new Map();
  private prevTripsMap: Map<string, TransporterTrip> = new Map();
  private isOrdersInitialSyncDone = false;
  private isTripsInitialSyncDone = false;
  private unsubscribeOrdersFn: (() => void) | null = null;
  private unsubscribeTripsFn: (() => void) | null = null;

  constructor() {
    this.initRealtimeListeners();
  }

  /**
   * Subscribe to global notification events (e.g. FarmerPortal toast system)
   */
  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  private notify(notification: GlobalOrderNotification) {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Error in notification listener:', err);
      }
    });
  }

  /**
   * Initialize Firestore real-time listeners for live synchronization
   */
  private initRealtimeListeners() {
    this.unsubscribeOrdersFn = subscribeOrders((orders) => {
      if (!this.isOrdersInitialSyncDone) {
        // Seed initial maps on boot
        orders.forEach((o) => this.prevOrdersMap.set(o.id, o));
        this.isOrdersInitialSyncDone = true;
        return;
      }

      orders.forEach((order) => {
        const prev = this.prevOrdersMap.get(order.id);
        if (!prev) {
          // NEW ORDER PLACED
          this.notify({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'ORDER_PLACED',
            title: '🚨 नया ऑर्डर प्राप्त हुआ!',
            message: `${order.buyerName || 'खरीदार'} ने ${order.items?.[0]?.cropHindi || order.items?.[0]?.crop || 'उपज'} का ऑर्डर दिया (${order.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 0} kg)`,
            orderCode: order.orderCode,
            totalAmount: order.totalAmount,
            produceName: order.items?.[0]?.cropHindi || order.items?.[0]?.crop || 'उपज',
            quantityKg: order.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 0,
            buyerName: order.buyerName || 'खरीदार',
            sellerName: order.sellerName,
            timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
            orderId: order.id,
          });
        } else if (prev.status !== order.status) {
          if (order.status === 'ACCEPTED') {
            this.notify({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              type: 'ORDER_ACCEPTED_FARMER',
              title: '✅ ऑर्डर स्वीकार किया गया',
              message: `ऑर्डर ${order.orderCode} स्वीकार किया जा चुका है।`,
              orderCode: order.orderCode,
              totalAmount: order.totalAmount,
              timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
              orderId: order.id,
            });
          } else if (order.status === 'PACKED') {
            this.notify({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              type: 'ORDER_PACKED',
              title: order.deliveryMethod === 'SELF_PICKUP' ? '📦 पिकअप के लिए तैयार!' : '📦 पैकिंग पूर्ण!',
              message: order.deliveryMethod === 'SELF_PICKUP' 
                ? `ऑर्डर ${order.orderCode} पिकअप के लिए तैयार है। कृपया पहुँचें।` 
                : `ऑर्डर ${order.orderCode} पैक हो चुका है। ट्रांसपोर्टर जल्द पिकअप करेगा।`,
              orderCode: order.orderCode,
              totalAmount: order.totalAmount,
              timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
              orderId: order.id,
            });
          } else if (order.status === 'DELIVERED') {
            this.notify({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              type: 'ORDER_DELIVERED',
              title: '🎉 डिलीवरी संपन्न!',
              message: `ऑर्डर ${order.orderCode} सफलतापूर्वक खरीदार को डिलीवर कर दिया गया है।`,
              orderCode: order.orderCode,
              totalAmount: order.totalAmount,
              timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
              orderId: order.id,
            });
          }
        }
        this.prevOrdersMap.set(order.id, order);
      });
    });

    this.unsubscribeTripsFn = subscribeTransporterTrips((trips) => {
      if (!this.isTripsInitialSyncDone) {
        trips.forEach((t) => this.prevTripsMap.set(t.id, t));
        this.isTripsInitialSyncDone = true;
        return;
      }

      trips.forEach((trip) => {
        const prev = this.prevTripsMap.get(trip.id);
        if (prev && prev.status !== trip.status) {
          if (trip.status === 'ACCEPTED') {
            this.notify({
              id: `notif-trip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              type: 'JOB_ACCEPTED_TRANSPORTER',
              title: '🚚 पिकअप स्वीकार हुआ!',
              message: `${trip.driverName || 'राज ट्रांसपोर्ट'} ने पिकअप स्वीकार किया (#${trip.orderCode})`,
              orderCode: trip.orderCode,
              produceName: trip.produceName,
              quantityKg: trip.quantityKg,
              driverName: trip.driverName,
              vehicleNumber: trip.vehicleNumber,
              timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
              tripId: trip.id,
            });
          }
        }
        this.prevTripsMap.set(trip.id, trip);
      });
    });
  }

  /**
   * Place new order from BuyerPortal
   */
  public async placeOrder(order: Order): Promise<string> {
    const customId = order.id || `ord-${Date.now()}`;
    const newOrder: Order = {
      ...order,
      id: customId,
      orderCode: order.orderCode || `ORD${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PLACED',
      placedAt: new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`,
    };

    try {
      await Promise.race([
        createOrder(newOrder),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
    } catch (err) {
      console.warn('createOrder error (proceeding optimistically):', err);
    }

    // Notify listeners immediately
    try {
      this.notify({
        id: `notif-${Date.now()}`,
        type: 'ORDER_PLACED',
        title: '🚨 नया ऑर्डर प्राप्त हुआ!',
        message: `${newOrder.buyerName || 'Rohit Verma'} ने ${newOrder.items?.[0]?.cropHindi || newOrder.items?.[0]?.crop || 'कृषि उपज'} का ऑर्डर दिया (${newOrder.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 0} kg)`,
        orderCode: newOrder.orderCode,
        totalAmount: newOrder.totalAmount,
        produceName: newOrder.items?.[0]?.cropHindi || newOrder.items?.[0]?.crop || 'उपज',
        quantityKg: newOrder.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 0,
        buyerName: newOrder.buyerName || 'Rohit Verma',
        sellerName: newOrder.sellerName,
        timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
        orderId: newOrder.id,
      });

      // Broadcast to all portals (Farmer, Transporter, Admin) in zero-latency
      logisticsSync.broadcast('ORDER_PLACED', {
        orderId: newOrder.orderCode,
        shipmentId: newOrder.id,
        buyerName: newOrder.buyerName || 'Rohit Verma',
        totalAmount: newOrder.totalAmount,
        produceName: newOrder.items?.[0]?.cropHindi || newOrder.items?.[0]?.crop || 'उपज',
        quantityKg: newOrder.items?.reduce((a, b) => a + (b.quantityKg || 0), 0) || 0,
        status: 'PLACED',
      });
    } catch (e) {}

    return customId;
  }

  /**
   * Accept job from TransporterPortal
   */
  public async acceptTransporterJob(trip: TransporterTrip): Promise<void> {
    let etaHours = 2;
    if (trip.eta) {
      const hMatch = trip.eta.match(/(\d+)\s*h/i);
      const mMatch = trip.eta.match(/(\d+)\s*m/i);
      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      const m = mMatch ? parseInt(mMatch[1], 10) : 0;
      if (h > 0 || m > 0) etaHours = Number((h + m / 60).toFixed(1));
    }

    await acceptTransporterTripApi(trip.id, etaHours, trip.freshnessRemainingHours || 24);
    await updateTransporterTrip(trip.id, {
      status: 'ACCEPTED',
      orderCode: trip.orderCode,
      driverName: trip.driverName || 'राज ट्रांसपोर्ट (राजेश कुमार)',
      vehicleNumber: trip.vehicleNumber || 'UP 32 AB 1234',
    });

    this.notify({
      id: `notif-${Date.now()}`,
      type: 'JOB_ACCEPTED_TRANSPORTER',
      title: '🚚 पिकअप स्वीकार हुआ!',
      message: `${trip.driverName || 'राज ट्रांसपोर्ट'} ने पिकअप जॉब स्वीकार कर लिया है (#${trip.orderCode})`,
      orderCode: trip.orderCode,
      produceName: trip.produceName,
      quantityKg: trip.quantityKg,
      driverName: trip.driverName || 'राज ट्रांसपोर्ट (राजेश कुमार)',
      vehicleNumber: trip.vehicleNumber || 'UP 32 AB 1234',
      timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      tripId: trip.id,
    });

    // Broadcast across portals
    logisticsSync.broadcast('JOB_ACCEPTED', {
      tripId: trip.id,
      orderId: trip.orderCode,
      produceName: trip.produceName,
      quantityKg: trip.quantityKg,
      status: 'ACCEPTED',
      transporter: {
        name: trip.driverName || 'राज ट्रांसपोर्ट (राजेश कुमार)',
        vehicleNumber: trip.vehicleNumber || 'UP 32 AB 1234',
        vehicleType: 'Mini Truck',
        phone: '+91 98765 43210',
        rating: 4.8,
        isOnline: true,
      },
    });
  }

  public cleanup() {
    if (this.unsubscribeOrdersFn) this.unsubscribeOrdersFn();
    if (this.unsubscribeTripsFn) this.unsubscribeTripsFn();
  }
}

export const globalOrderManager = new GlobalOrderManager();
