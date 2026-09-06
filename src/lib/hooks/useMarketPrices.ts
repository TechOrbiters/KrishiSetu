import { useState, useEffect, useCallback } from 'react';
import { getMarketPrices, getMarketPriceSummary, syncMarketPrices } from '../api/client';
import { MarketPriceQueryFilters, MarketPriceRecord, MarketPriceSummaryCard } from '../types/market';

export function useMarketPrices(initialFilters: MarketPriceQueryFilters = {}) {
  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [summary, setSummary] = useState<MarketPriceSummaryCard[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (filters: MarketPriceQueryFilters = initialFilters) => {
    setLoading(true);
    setError(null);
    const res = await getMarketPrices(filters);
    if (res.success && res.data) {
      setPrices(res.data.prices || []);
      setTotalRecords(res.data.pagination?.total || (res.data.prices ? res.data.prices.length : 0));
    } else {
      setError(res.error?.message || 'बाजार भाव लोड करने में विफल');
    }
    setLoading(false);
  }, [initialFilters]);

  const fetchSummary = useCallback(async () => {
    const res = await getMarketPriceSummary();
    if (res.success && res.data) {
      setSummary(res.data);
    }
  }, []);

  const triggerSync = async (stateName: string = 'Uttar Pradesh') => {
    setLoading(true);
    const res = await syncMarketPrices(stateName);
    if (res.success) {
      await fetchPrices();
      await fetchSummary();
    } else {
      setError(res.message || 'बाजार भाव सिंक करने में त्रुटि');
    }
    setLoading(false);
    return res;
  };

  useEffect(() => {
    fetchPrices();
    fetchSummary();
  }, [fetchPrices, fetchSummary]);

  return { prices, summary, totalRecords, loading, error, fetchPrices, triggerSync };
}
