/**
 * KRISHISETU — Canonical Market Price Types & Response Contracts
 * Source: Government of India OGD / AGMARKNET (data.gov.in)
 */

export interface MarketPriceRecord {
  id: string; // state-district-market-commodity-variety-arrivalDate
  commodity: string;
  variety: string;
  grade: string;
  state: string;
  district: string;
  market: string;
  minPrice: number; // ₹ per quintal (native source)
  maxPrice: number; // ₹ per quintal (native source)
  modalPrice: number; // ₹ per quintal (native source)
  pricePerKg: number; // Math.round((modalPrice / 100) * 10) / 10
  unit: '₹/quintal';
  priceDate: string; // ISO YYYY-MM-DD
  rawArrivalDate: string; // Native DD/MM/YYYY
  change?: number | null;
  trend?: 'UP' | 'DOWN' | 'FLAT' | 'NONE';
  cropImage?: string;
  commodityHindi?: string;
  category?: 'VEGETABLES' | 'GRAINS' | 'FRUITS' | 'PULSES' | 'OILSEEDS' | 'OTHERS';
  isLocal?: boolean;
  source: 'Government of India OGD / AGMARKNET' | 'Local Cache Fallback';
  sourceTimestamp: string;
  fetchedAt: string;
}

export interface MarketPriceQueryFilters {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  page?: number;
  limit?: number;
}

export interface MarketPriceSummaryCard {
  crop: string;
  mandi: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  pricePerKg: number;
  changeText: string;
  trend: 'UP' | 'DOWN' | 'FLAT' | 'NONE';
  trendPercent: number;
  cropImage: string;
  updatedAt: string;
}

export interface MarketPriceApiResponse {
  success: boolean;
  data?: {
    prices: MarketPriceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
    meta: {
      source: string;
      lastUpdated: string;
      isFallback?: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
