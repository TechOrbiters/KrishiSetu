import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MarketPrice } from '../types';
import { fetchLiveMandiPricesApi } from '../lib/apiServices';
import { MARKET_PRICES as fallbackMarketPrices } from '../data/mockData';

export interface LiveCropSummary {
  crop: string;
  cropHindi: string;
  modalPriceQuintal: number;
  pricePerKg: number;
  platformPriceKg: number;
  savingsPct: number;
  mandi: string;
  arrivalDate?: string;
  trend: 'UP' | 'DOWN';
}

export type MandiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'SERVER_DOWN'
  | 'EMPTY_DATA';

export interface MandiErrorDetails {
  message: string;
  messageHindi: string;
  code: MandiErrorCode;
  statusCode?: number;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  nextRetryCountdown: number | null;
  isFallbackActive: boolean;
}

export interface UseLiveMandiPricesOptions {
  defaultState?: string;
  defaultCommodity?: string;
  defaultLimit?: number;
  autoFetch?: boolean;
  refreshIntervalMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  enableLocalStorage?: boolean;
  fallbackPrices?: MarketPrice[];
}

export interface UseLiveMandiPricesReturn {
  prices: MarketPrice[];
  filteredPrices: MarketPrice[];
  liveCropsSummary: Record<string, LiveCropSummary>;
  loading: boolean;
  isFetching: boolean;
  isRevalidating: boolean;
  error: string | null;
  errorDetails: MandiErrorDetails | null;
  isFallback: boolean;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  nextRetryCountdown: number | null;
  lastUpdated: string;
  updatedAt: string | null;
  lastSuccessfulFetch: string | null;
  selectedState: string;
  setSelectedState: (state: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  retry: () => Promise<void>;
  cancelRetry: () => void;
  isLive: boolean;
  totalRecords: number;
  getCropPrice: (cropName: string) => LiveCropSummary | null;
  availableStates: { label: string; value: string }[];
  categories: { label: string; value: string }[];
}

export const INDIAN_AGRI_STATES = [
  { label: 'उत्तर प्रदेश (Uttar Pradesh)', value: 'Uttar Pradesh' },
  { label: 'पंजाब (Punjab)', value: 'Punjab' },
  { label: 'हरियाणा (Haryana)', value: 'Haryana' },
  { label: 'मध्य प्रदेश (Madhya Pradesh)', value: 'Madhya Pradesh' },
  { label: 'महाराष्ट्र (Maharashtra)', value: 'Maharashtra' },
  { label: 'राजस्थान (Rajasthan)', value: 'Rajasthan' },
  { label: 'बिहार (Bihar)', value: 'Bihar' },
  { label: 'गुजरात (Gujarat)', value: 'Gujarat' },
  { label: 'अखिल भारतीय (All India)', value: 'ALL' },
];

export const MANDI_CATEGORIES = [
  { label: 'सभी जिंस (All)', value: 'ALL' },
  { label: 'अनाज (Grains)', value: 'GRAINS' },
  { label: 'सब्जियां (Vegetables)', value: 'VEGETABLES' },
  { label: 'तिलहन (Oilseeds)', value: 'OILSEEDS' },
  { label: 'दालें (Pulses)', value: 'PULSES' },
  { label: 'फल (Fruits)', value: 'FRUITS' },
];

const INITIAL_CROPS_SUMMARY: Record<string, LiveCropSummary> = {
  wheat: {
    crop: 'Wheat',
    cropHindi: 'गेहूं',
    modalPriceQuintal: 2400,
    pricePerKg: 24,
    platformPriceKg: 22,
    savingsPct: 8,
    mandi: 'Bachranwa APMC (Raebarelli)',
    trend: 'UP',
  },
  potato: {
    crop: 'Potato',
    cropHindi: 'आलू',
    modalPriceQuintal: 705,
    pricePerKg: 7,
    platformPriceKg: 6.5,
    savingsPct: 7,
    mandi: 'Aligarh APMC (UP)',
    trend: 'DOWN',
  },
  rice: {
    crop: 'Paddy',
    cropHindi: 'धान / चावल',
    modalPriceQuintal: 2050,
    pricePerKg: 21,
    platformPriceKg: 19,
    savingsPct: 10,
    mandi: 'Naveen Galla Mandi (Lucknow)',
    trend: 'UP',
  },
  mustard: {
    crop: 'Mustard',
    cropHindi: 'सरसों',
    modalPriceQuintal: 5350,
    pricePerKg: 54,
    platformPriceKg: 49,
    savingsPct: 9,
    mandi: 'Sitapur Mandi (UP)',
    trend: 'UP',
  },
  tomato: {
    crop: 'Tomato',
    cropHindi: 'टमाटर',
    modalPriceQuintal: 2200,
    pricePerKg: 22,
    platformPriceKg: 20,
    savingsPct: 9,
    mandi: 'Barabanki APMC (UP)',
    trend: 'UP',
  },
  onion: {
    crop: 'Onion',
    cropHindi: 'प्याज',
    modalPriceQuintal: 2800,
    pricePerKg: 28,
    platformPriceKg: 25,
    savingsPct: 11,
    mandi: 'Lucknow APMC (UP)',
    trend: 'UP',
  },
};

const CACHE_PREFIX = 'kisansetu_mandi_cache_';

function getLocalCachedMandi(state: string) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${state}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Valid if less than 24 hours old
      if (parsed && Array.isArray(parsed.records) && Date.now() - parsed.timestamp < 86400000) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage issues
  }
  return null;
}

function saveLocalCachedMandi(state: string, data: any) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${state}`,
      JSON.stringify({
        timestamp: Date.now(),
        records: data.records,
        liveCropsSummary: data.liveCropsSummary,
        updatedAt: data.updatedAt,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Enhanced React hook for Data.gov.in (Agmarknet APMC) real-time commodity prices.
 * Includes robust error states, exponential backoff retries, request timeouts with AbortController,
 * and reliable fallback mechanisms to prevent crashes during service downtime.
 */
export function useLiveMandiPrices(options: UseLiveMandiPricesOptions = {}): UseLiveMandiPricesReturn {
  const {
    defaultState = 'Uttar Pradesh',
    defaultCommodity,
    defaultLimit = 50,
    autoFetch = true,
    refreshIntervalMs,
    maxRetries = 3,
    retryDelayMs = 2000,
    timeoutMs = 9000,
    enableLocalStorage = true,
    fallbackPrices = fallbackMarketPrices,
  } = options;

  const [prices, setPrices] = useState<MarketPrice[]>(() => fallbackPrices || []);
  const [liveCropsSummary, setLiveCropsSummary] = useState<Record<string, LiveCropSummary>>(
    () => INITIAL_CROPS_SUMMARY
  );

  const [selectedState, setSelectedState] = useState<string>(defaultState);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Loading and fetch state indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  
  // Robust error state indicators
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<MandiErrorDetails | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(true);

  // Retry state
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [nextRetryCountdown, setNextRetryCountdown] = useState<number | null>(null);

  // Time tracking
  const [lastUpdated, setLastUpdated] = useState<string>('आज, 08:30 AM');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  // Refs for tracking lifecycle, active timers, and abort controllers
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Clear timers helper
  const clearRetryTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setNextRetryCountdown(null);
    setIsRetrying(false);
  }, []);

  const cancelRetry = useCallback(() => {
    clearRetryTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsFetching(false);
    setLoading(false);
  }, [clearRetryTimers]);

  // Main fetch function with timeout, retry backoff, and robust error handling
  const executeFetch = useCallback(
    async (isManual = false, currentAttempt = 0): Promise<void> => {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Setup dynamic timeout (increases with retries to handle high-latency networks)
      const currentTimeoutMs = timeoutMs + (currentAttempt * 3000);
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, currentTimeoutMs);

      if (prices.length === 0 || isManual) {
        setLoading(true);
      }
      setIsFetching(true);
      setIsRevalidating(true);
      if (currentAttempt === 0) {
        setError(null);
        setErrorDetails(null);
      }

      try {
        const data = await fetchLiveMandiPricesApi({
          state: selectedState,
          commodity: defaultCommodity,
          limit: defaultLimit,
          forceRefresh: isManual,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!isMountedRef.current) return;

        if (data?.records && Array.isArray(data.records) && data.records.length > 0) {
          setPrices(data.records);
          setIsLive(true);
          setIsFallback(false);
          setError(null);
          setErrorDetails(null);
          setRetryCount(0);
          clearRetryTimers();

          const isoTime = data.updatedAt || new Date().toISOString();
          setUpdatedAt(isoTime);
          setLastSuccessfulFetch(isoTime);

          const formattedTime = new Date(isoTime).toLocaleTimeString('hi-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastUpdated(`आज, ${formattedTime}`);

          if (data.liveCropsSummary && Object.keys(data.liveCropsSummary).length > 0) {
            setLiveCropsSummary((prev) => ({
              ...prev,
              ...data.liveCropsSummary,
            }));
          }

          if (enableLocalStorage) {
            saveLocalCachedMandi(selectedState, data);
          }
        } else {
          // Empty data response
          throw new Error('मंडी पोर्टल से कोई रिकॉर्ड प्राप्त नहीं हुआ');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (!isMountedRef.current) return;

        console.warn(`Data.gov.in mandi price fetch error (Attempt ${currentAttempt + 1}/${maxRetries}):`, err);

        let code: MandiErrorCode = 'API_ERROR';
        let hindiMessage = 'सरकारी APMC मंडी सर्वर से डेटा प्राप्त करने में समस्या आई।';

        if (err.isTimeout || err.name === 'AbortError') {
          code = 'TIMEOUT';
          hindiMessage = 'मंडी सर्वर प्रतिक्रिया में अधिक समय लग रहा है (समय समाप्त)।';
        } else if (err.status === 429) {
          code = 'RATE_LIMIT';
          hindiMessage = 'मंडी डेटा सीमा पार हो गई है (दर सीमा)।';
        } else if (err.status >= 500) {
          code = 'SERVER_DOWN';
          hindiMessage = 'Data.gov.in मंडी सर्वर रखरखाव में है या अस्थायी रूप से अनुपलब्ध है।';
        } else if (!navigator.onLine) {
          code = 'NETWORK_ERROR';
          hindiMessage = 'इंटरनेट कनेक्शन उपलब्ध नहीं है। ऑफलाइन मोड सक्रिय है।';
        }

        const nextAttempt = currentAttempt + 1;
        setRetryCount(nextAttempt);
        setIsFallback(true);

        // Fallback to cached or static dataset to ensure zero-crash guarantee
        if (prices.length === 0) {
          const cached = enableLocalStorage ? getLocalCachedMandi(selectedState) : null;
          setPrices(cached?.records || fallbackPrices || []);
          if (cached?.liveCropsSummary) {
            setLiveCropsSummary(cached.liveCropsSummary);
          }
        }

        // Automatic retry logic if within max retries
        if (nextAttempt < maxRetries && !controller.signal.aborted) {
          const delay = retryDelayMs * Math.pow(1.8, currentAttempt); // Exponential backoff: ~2s, ~3.6s, ~6.5s
          const delaySeconds = Math.ceil(delay / 1000);
          
          setIsRetrying(true);
          setNextRetryCountdown(delaySeconds);

          const errInfo: MandiErrorDetails = {
            message: err.message || 'Mandi price service unreachable',
            messageHindi: hindiMessage,
            code,
            statusCode: err.status,
            timestamp: new Date().toISOString(),
            retryCount: nextAttempt,
            maxRetries,
            nextRetryCountdown: delaySeconds,
            isFallbackActive: true,
          };

          setError(hindiMessage);
          setErrorDetails(errInfo);

          // Interval to tick down seconds
          let remaining = delaySeconds;
          countdownIntervalRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setNextRetryCountdown(null);
            } else {
              setNextRetryCountdown(remaining);
            }
          }, 1000);

          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              executeFetch(false, nextAttempt);
            }
          }, delay);
        } else {
          // Exhausted retries
          clearRetryTimers();
          const errInfo: MandiErrorDetails = {
            message: err.message || 'Mandi price service unreachable after retries',
            messageHindi: `${hindiMessage} सत्यापित ऑफ़लाइन बैकअप डेटा प्रदर्शित किया जा रहा है।`,
            code,
            statusCode: err.status,
            timestamp: new Date().toISOString(),
            retryCount: nextAttempt,
            maxRetries,
            nextRetryCountdown: null,
            isFallbackActive: true,
          };
          setError(errInfo.messageHindi);
          setErrorDetails(errInfo);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsFetching(false);
          setIsRevalidating(false);
        }
      }
    },
    [
      selectedState,
      defaultCommodity,
      defaultLimit,
      timeoutMs,
      maxRetries,
      retryDelayMs,
      enableLocalStorage,
      prices.length,
      fallbackPrices,
      clearRetryTimers,
    ]
  );

  // Manual refetch triggering immediate fresh call
  const refetch = useCallback(
    async (forceRefresh = true) => {
      clearRetryTimers();
      setRetryCount(0);
      await executeFetch(forceRefresh, 0);
    },
    [clearRetryTimers, executeFetch]
  );

  // Manual retry trigger
  const retry = useCallback(async () => {
    clearRetryTimers();
    setRetryCount(0);
    await executeFetch(true, 0);
  }, [clearRetryTimers, executeFetch]);

  // Auto fetch when selected state changes
  useEffect(() => {
    clearRetryTimers();
    // Try to load cached data for selected state immediately
    if (enableLocalStorage) {
      const stateCache = getLocalCachedMandi(selectedState);
      if (stateCache?.records?.length) {
        setPrices(stateCache.records);
        if (stateCache.liveCropsSummary) {
          setLiveCropsSummary(stateCache.liveCropsSummary);
        }
        if (stateCache.updatedAt) {
          setUpdatedAt(stateCache.updatedAt);
        }
      }
    }

    if (autoFetch) {
      executeFetch(false, 0);
    }
  }, [selectedState, autoFetch, enableLocalStorage, executeFetch, clearRetryTimers]);

  // Optional recurring refresh
  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;
    const interval = setInterval(() => {
      if (navigator.onLine && !isRetrying) {
        executeFetch(false, 0);
      }
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshIntervalMs, isRetrying, executeFetch]);

  // Filtered prices based on search & category with defensive null safety
  const filteredPrices = useMemo(() => {
    if (!Array.isArray(prices)) return [];
    return prices.filter((item) => {
      if (!item) return false;
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase().trim();
      const matchCrop = (item.crop || '').toLowerCase().includes(q);
      const matchHindi = (item.cropHindi || '').includes(q);
      const matchMandi = (item.mandi || '').toLowerCase().includes(q);
      const matchDistrict = (item.district || '').toLowerCase().includes(q);
      const matchVariety = (item.variety || '').toLowerCase().includes(q);

      return matchCrop || matchHindi || matchMandi || matchDistrict || matchVariety;
    });
  }, [prices, selectedCategory, searchQuery]);

  // Quick helper to retrieve specific crop price info with safe fallback
  const getCropPrice = useCallback(
    (cropName: string): LiveCropSummary | null => {
      if (!cropName) return null;
      const normalized = cropName.toLowerCase().trim();
      // 1. Direct match in liveCropsSummary
      if (liveCropsSummary && liveCropsSummary[normalized]) {
        return liveCropsSummary[normalized];
      }

      // 2. Search in prices array
      if (Array.isArray(prices)) {
        const found = prices.find(
          (p) =>
            (p.crop && p.crop.toLowerCase().includes(normalized)) ||
            (p.cropHindi && p.cropHindi.toLowerCase().includes(normalized)) ||
            (p.crop && normalized.includes(p.crop.toLowerCase())) ||
            (p.cropHindi && normalized.includes(p.cropHindi))
        );

        if (found) {
          return {
            crop: found.crop || cropName,
            cropHindi: found.cropHindi || cropName,
            modalPriceQuintal: found.avgPrice || 0,
            pricePerKg: found.retailMandiPriceKg || Math.round((found.avgPrice || 0) / 100),
            platformPriceKg: found.platformPriceKg || Math.round(((found.avgPrice || 0) / 100) * 0.9),
            savingsPct: found.savingsPercentage || 10,
            mandi: found.mandi || 'APMC Mandi',
            arrivalDate: found.arrivalDate,
            trend: found.trend || 'UP',
          };
        }
      }

      return null;
    },
    [liveCropsSummary, prices]
  );

  return {
    prices,
    filteredPrices,
    liveCropsSummary,
    loading,
    isFetching,
    isRevalidating: isFetching && prices.length > 0,
    error,
    errorDetails,
    isFallback,
    retryCount,
    maxRetries,
    isRetrying,
    nextRetryCountdown,
    lastUpdated,
    updatedAt,
    lastSuccessfulFetch,
    selectedState,
    setSelectedState,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refetch,
    retry,
    cancelRetry,
    isLive,
    totalRecords: filteredPrices.length,
    getCropPrice,
    availableStates: INDIAN_AGRI_STATES,
    categories: MANDI_CATEGORIES,
  };
}
