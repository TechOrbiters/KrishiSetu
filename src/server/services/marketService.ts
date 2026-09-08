/**
 * KRISHISETU — Market Price Service & Caching Architecture
 * Manages Supabase persistence, in-memory fallback cache, deduplication, and trend calculation.
 */

import { MarketPriceRecord, MarketPriceQueryFilters, MarketPriceSummaryCard } from "../../lib/types/market";
import { activeDataGovProvider } from "../integrations/market/dataGovProvider";
import { supabaseAdmin } from "../../lib/supabase/server";

// Fallback seed records for initialization when external network is unconfigured/offline
const INITIAL_GOVT_SEED: MarketPriceRecord[] = [
  {
    id: 'uttar-pradesh-barabanki-lucknow-apmc-wheat-dara-05-09-2026',
    commodity: 'Wheat',
    variety: 'Dara',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 2400,
    maxPrice: 2600,
    modalPrice: 2500,
    pricePerKg: 25.0,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: 25,
    trend: 'UP',
    cropImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
  {
    id: 'uttar-pradesh-lucknow-lucknow-apmc-potato-other-05-09-2026',
    commodity: 'Potato',
    variety: 'Other',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 1350,
    maxPrice: 1550,
    modalPrice: 1450,
    pricePerKg: 14.5,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: -30,
    trend: 'DOWN',
    cropImage: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
  {
    id: 'uttar-pradesh-lucknow-lucknow-apmc-paddy-common-other-05-09-2026',
    commodity: 'Paddy(Common)',
    variety: 'Other',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 1950,
    maxPrice: 2150,
    modalPrice: 2050,
    pricePerKg: 20.5,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: 18,
    trend: 'UP',
    cropImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
  {
    id: 'uttar-pradesh-lucknow-lucknow-apmc-mustard-other-05-09-2026',
    commodity: 'Mustard',
    variety: 'Other',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 5150,
    maxPrice: 5550,
    modalPrice: 5350,
    pricePerKg: 53.5,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: 65,
    trend: 'UP',
    cropImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
  {
    id: 'uttar-pradesh-lucknow-lucknow-apmc-tomato-other-05-09-2026',
    commodity: 'Tomato',
    variety: 'Other',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 800,
    maxPrice: 1100,
    modalPrice: 950,
    pricePerKg: 9.5,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: -20,
    trend: 'DOWN',
    cropImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
  {
    id: 'uttar-pradesh-lucknow-lucknow-apmc-onion-other-05-09-2026',
    commodity: 'Onion',
    variety: 'Other',
    grade: 'FAQ',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow APMC',
    minPrice: 1200,
    maxPrice: 1500,
    modalPrice: 1350,
    pricePerKg: 13.5,
    unit: '₹/quintal',
    priceDate: '2026-09-05',
    rawArrivalDate: '05/09/2026',
    change: 10,
    trend: 'UP',
    cropImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=100',
    source: 'Government of India OGD / AGMARKNET',
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  },
];

// In-Memory Storage Cache
let memoryStore: MarketPriceRecord[] = [...INITIAL_GOVT_SEED];
let lastSyncTimestamp = new Date().toISOString();

export class MarketPriceService {
  /**
   * Sync fresh market prices from Government data.gov.in API into Supabase & Memory Cache
   */
  async syncFromDataGov(filters: MarketPriceQueryFilters = {}): Promise<{
    success: boolean;
    fetched: number;
    stored: number;
    error?: string;
  }> {
    const fetchRes = await activeDataGovProvider.fetchPrices({
      state: filters.state || 'Uttar Pradesh',
      limit: filters.limit || 300,
    });

    if (!fetchRes.success || fetchRes.records.length === 0) {
      return {
        success: false,
        fetched: 0,
        stored: memoryStore.length,
        error: fetchRes.error || 'FAILED_TO_FETCH_GOVT_DATA',
      };
    }

    // Deduplicate & Update Memory Cache
    const newRecords = fetchRes.records;
    for (const rec of newRecords) {
      const idx = memoryStore.findIndex((m) => m.id === rec.id);
      if (idx >= 0) {
        memoryStore[idx] = rec;
      } else {
        memoryStore.unshift(rec);
      }
    }

    lastSyncTimestamp = new Date().toISOString();

    // Persist to Supabase PostgreSQL table `market_prices` (aligned schema)
    try {
      const dbPayload = newRecords.map((r) => ({
        crop_name: r.commodity,
        district: r.district,
        mandi_name: r.market,
        modal_price_per_kg: r.pricePerKg,
        min_price_per_kg: Math.round((r.minPrice / 100) * 10) / 10,
        max_price_per_kg: Math.round((r.maxPrice / 100) * 10) / 10,
        recorded_at: r.priceDate,
      }));

      if (dbPayload.length > 0) {
        const { error: dbError } = await supabaseAdmin
          .from('market_prices')
          .insert(dbPayload);
        if (dbError) {
          console.warn('[MarketPriceService] Supabase insert warning:', dbError.message);
        }
      }
    } catch (dbErr: any) {
      console.warn('[MarketPriceService] Supabase sync notice:', dbErr.message);
    }

    return {
      success: true,
      fetched: newRecords.length,
      stored: memoryStore.length,
    };
  }

  /**
   * Fetch market prices with search, filtering, and pagination
   */
  async getMarketPrices(filters: MarketPriceQueryFilters = {}): Promise<{
    prices: MarketPriceRecord[];
    pagination: { page: number; limit: number; total: number };
    lastUpdated: string;
    isFallback: boolean;
  }> {
    // If memory store is low, attempt an initial sync automatically
    if (memoryStore.length <= INITIAL_GOVT_SEED.length) {
      await this.syncFromDataGov({ state: filters.state || 'Uttar Pradesh', limit: 300 });
    }

    let filtered = [...memoryStore];

    if (filters.state && filters.state !== 'सभी राज्य' && filters.state !== 'ALL') {
      const st = filters.state.toLowerCase();
      filtered = filtered.filter((r) => r.state.toLowerCase().includes(st));
    }

    if (filters.district) {
      const dist = filters.district.toLowerCase();
      filtered = filtered.filter((r) => r.district.toLowerCase().includes(dist));
    }

    if (filters.market) {
      const mkt = filters.market.toLowerCase();
      filtered = filtered.filter((r) => r.market.toLowerCase().includes(mkt));
    }

    if (filters.commodity && filters.commodity !== 'सभी फसलें' && filters.commodity !== 'ALL') {
      const cmd = filters.commodity.toLowerCase();
      filtered = filtered.filter(
        (r) => r.commodity.toLowerCase().includes(cmd) || cmd.includes(r.commodity.toLowerCase())
      );
    }

    // If specific filter resulted in 0 matches in memoryStore, try dynamic live fetch
    if (filtered.length === 0 && (filters.district || filters.commodity)) {
      const liveFetch = await activeDataGovProvider.fetchPrices({
        state: filters.state || 'Uttar Pradesh',
        district: filters.district,
        commodity: filters.commodity,
        limit: filters.limit || 50,
      });
      if (liveFetch.success && liveFetch.records.length > 0) {
        for (const rec of liveFetch.records) {
          const idx = memoryStore.findIndex((m) => m.id === rec.id);
          if (idx >= 0) {
            memoryStore[idx] = rec;
          } else {
            memoryStore.unshift(rec);
          }
        }
        filtered = liveFetch.records;
      }
    }

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      prices: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
      },
      lastUpdated: lastSyncTimestamp,
      isFallback: memoryStore.length === INITIAL_GOVT_SEED.length,
    };
  }

  /**
   * Get 4 Top KPI Summary Cards for Dashboard and Bazaar Bhav Page
   */
  async getSummaryCards(): Promise<MarketPriceSummaryCard[]> {
    const { prices } = await this.getMarketPrices({ limit: 300 });

    const targetCrops = [
      { key: 'wheat', hindi: 'गेहूँ', img: CROP_IMAGES.wheat },
      { key: 'potato', hindi: 'आलू', img: CROP_IMAGES.potato },
      { key: 'paddy', hindi: 'धान (साधारण)', img: CROP_IMAGES.paddy },
      { key: 'mustard', hindi: 'सरसों', img: CROP_IMAGES.mustard },
      { key: 'tomato', hindi: 'टमाटर', img: CROP_IMAGES.tomato },
      { key: 'onion', hindi: 'प्याज', img: CROP_IMAGES.onion },
      { key: 'garlic', hindi: 'लहसुन', img: CROP_IMAGES.garlic },
      { key: 'gram', hindi: 'चना', img: CROP_IMAGES.gram },
    ];

    const cards: MarketPriceSummaryCard[] = [];
    const usedCropKeys = new Set<string>();

    for (const cropObj of targetCrops) {
      if (cards.length >= 4) break;
      const match = prices.find(
        (p) => p.commodity.toLowerCase().includes(cropObj.key) && !usedCropKeys.has(cropObj.key)
      );

      if (match) {
        usedCropKeys.add(cropObj.key);
        const modalPrice = match.modalPrice;
        const changeVal = match.change ?? 20;
        const trend = changeVal >= 0 ? 'UP' : 'DOWN';
        const trendPercent = Math.round((Math.abs(changeVal) / modalPrice) * 10000) / 100;

        cards.push({
          crop: cropObj.hindi,
          mandi: match.market || `${match.district || 'लखनऊ'} मंडी`,
          modalPrice,
          minPrice: match.minPrice,
          maxPrice: match.maxPrice,
          pricePerKg: match.pricePerKg,
          changeText: `${trend === 'UP' ? '↑' : '↓'} ${Math.abs(changeVal)} (${trendPercent}%)`,
          trend,
          trendPercent,
          cropImage: cropObj.img || match.cropImage || CROP_IMAGES.wheat,
          updatedAt: match.rawArrivalDate || 'आज',
        });
      }
    }

    // If fewer than 4 cards matched target list, fill with any top distinct commodities from prices
    if (cards.length < 4) {
      for (const p of prices) {
        if (cards.length >= 4) break;
        const commLower = p.commodity.toLowerCase();
        if (!usedCropKeys.has(commLower)) {
          usedCropKeys.add(commLower);
          const modalPrice = p.modalPrice;
          const changeVal = p.change ?? 15;
          const trend = changeVal >= 0 ? 'UP' : 'DOWN';
          const trendPercent = Math.round((Math.abs(changeVal) / modalPrice) * 10000) / 100;

          cards.push({
            crop: p.commodity,
            mandi: p.market || `${p.district || 'मंडी'} APMC`,
            modalPrice,
            minPrice: p.minPrice,
            maxPrice: p.maxPrice,
            pricePerKg: p.pricePerKg,
            changeText: `${trend === 'UP' ? '↑' : '↓'} ${Math.abs(changeVal)} (${trendPercent}%)`,
            trend,
            trendPercent,
            cropImage: p.cropImage || CROP_IMAGES.wheat,
            updatedAt: p.rawArrivalDate || 'आज',
          });
        }
      }
    }

    return cards;
  }
}

const CROP_IMAGES: Record<string, string> = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
  paddy: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  mustard: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=100',
  garlic: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=100',
  gram: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
};

export const activeMarketService = new MarketPriceService();
