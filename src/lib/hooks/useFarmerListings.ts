import { useState, useEffect, useCallback } from 'react';
import {
  fetchFarmerListings,
  createFarmerListing,
  updateFarmerListing,
  deleteFarmerListing,
  pauseFarmerListing,
} from '../api/client';
import { ProduceItem } from '../seedData';

export function useFarmerListings(farmerId?: string) {
  const [listings, setListings] = useState<ProduceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchFarmerListings(farmerId);
    if (res.success && res.data) {
      setListings(res.data);
    } else {
      setError(res.error || 'उपज सूचियाँ लोड नहीं हो सकीं');
    }
    setLoading(false);
  }, [farmerId]);

  const createListing = async (payload: any) => {
    setError(null);
    const res = await createFarmerListing(payload);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'नई उपज जोड़ने में विफल');
    }
    return res;
  };

  const updateListing = async (id: string, updates: any) => {
    setError(null);
    const res = await updateFarmerListing(id, updates);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'उपज अपडेट करने में विफल');
    }
    return res;
  };

  const pauseListing = async (id: string, currentStatus: string) => {
    setError(null);
    const res = await pauseFarmerListing(id, currentStatus);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'स्टेटस बदलने में विफल');
    }
    return res;
  };

  const deleteListing = async (id: string) => {
    setError(null);
    const res = await deleteFarmerListing(id);
    if (res.success) {
      await refetch();
    } else {
      setError(res.error || 'उपज हटाने में विफल');
    }
    return res;
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    listings,
    loading,
    error,
    refetch,
    refresh: refetch,
    createListing,
    addListing: createListing,
    updateListing,
    pauseListing,
    deleteListing,
  };
}
