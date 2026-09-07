import { useState, useEffect, useCallback } from 'react';
import { fetchFarmerOrders, acceptFarmerOrder, rejectFarmerOrder } from '../api/client';
import { OrderItem } from '../seedData';
import { logisticsSync } from '../realtime/logisticsSync';
import { updateOrder as updateFirestoreOrder } from '../firebase';

export function useFarmerOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const res = await fetchFarmerOrders();
    if (res.success && res.data) {
      setOrders(res.data);
    } else {
      setError(res.error || 'ऑर्डर लोड नहीं हो सके');
    }
    setLoading(false);
  }, []);

  const acceptOrder = async (orderId: string) => {
    setError(null);
    // Optimistic status update in local state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'ACCEPTED' } : o))
    );

    // Update Firestore if available
    try {
      await updateFirestoreOrder(orderId, { status: 'ACCEPTED' });
    } catch (e) {}

    const res = await acceptFarmerOrder(orderId);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'ऑर्डर स्वीकार करने में त्रुटि');
    }
    return res;
  };

  const rejectOrder = async (orderId: string) => {
    setError(null);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );

    try {
      await updateFirestoreOrder(orderId, { status: 'CANCELLED' });
    } catch (e) {}

    const res = await rejectFarmerOrder(orderId);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'ऑर्डर अस्वीकार करने में त्रुटि');
    }
    return res;
  };

  useEffect(() => {
    refetch();

    // Zero-latency cross-portal event synchronization
    const unsubscribe = logisticsSync.subscribe((event) => {
      if (
        [
          'ORDER_PLACED',
          'ORDER_ACCEPTED',
          'ORDER_PACKED',
          'JOB_ACCEPTED',
          'TRIP_STATUS_UPDATED',
          'POD_VERIFIED',
        ].includes(event.type)
      ) {
        refetch();
      }
    });

    // Periodic live sync fallback (every 4 seconds)
    const interval = setInterval(() => {
      refetch();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refetch]);

  return { orders, loading, error, refetch, refresh: refetch, acceptOrder, rejectOrder };
}
