import { useState, useEffect, useCallback } from 'react';
import { fetchFarmerOrders, acceptFarmerOrder, rejectFarmerOrder } from '../api/client';
import { OrderItem } from '../seedData';

export function useFarmerOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
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
  }, [refetch]);

  return { orders, loading, error, refetch, refresh: refetch, acceptOrder, rejectOrder };
}
