/**
 * KRISHISETU — Government of India OGD Market Price Provider (AGMARKNET)
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 * Source: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
 */

import { MarketPriceRecord, MarketPriceQueryFilters } from "../../../lib/types/market";

export interface DataGovFetchResult {
  success: boolean;
  total: number;
  records: MarketPriceRecord[];
  updatedDate?: string;
  error?: string;
}

// Map of Hindi crop image URLs for rich UI display
const CROP_IMAGES: Record<string, string> = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  gehun: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
  aalu: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
  paddy: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  mustard: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  sarson: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
  tamatar: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=100',
  pyaj: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=100',
  gram: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
  chana: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
  garlic: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=100',
  lahsun: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=100',
};

function getCropImage(commodity: string): string {
  const norm = commodity.toLowerCase();
  for (const [key, url] of Object.entries(CROP_IMAGES)) {
    if (norm.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100';
}

function parseArrivalDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Native format: "DD/MM/YYYY" -> "YYYY-MM-DD"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

export class DataGovMarketProvider {
  private resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
  private baseUrl = 'https://api.data.gov.in/resource';

  async fetchPrices(filters: MarketPriceQueryFilters = {}): Promise<DataGovFetchResult> {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) {
      console.warn('[DataGovMarketProvider] DATA_GOV_API_KEY environment variable is missing.');
      return {
        success: false,
        total: 0,
        records: [],
        error: 'DATA_GOV_API_KEY_MISSING',
      };
    }

    const limit = Math.min(filters.limit || 100, 500);
    const page = Math.max(filters.page || 1, 1);
    const offset = (page - 1) * limit;

    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (filters.state) {
      params.append('filters[state]', filters.state);
    }
    if (filters.district) {
      params.append('filters[district]', filters.district);
    }
    if (filters.market) {
      params.append('filters[market]', filters.market);
    }
    if (filters.commodity) {
      params.append('filters[commodity]', filters.commodity);
    }

    const url = `${this.baseUrl}/${this.resourceId}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000), // 8-second safeguard timeout
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`[DataGovMarketProvider] HTTP Error ${res.status}`);
        return {
          success: false,
          total: 0,
          records: [],
          error: `HTTP_${res.status}`,
        };
      }

      const json = await res.json();

      if (json.status !== 'ok' || !Array.isArray(json.records)) {
        return {
          success: false,
          total: 0,
          records: [],
          error: json.message || 'INVALID_PROVIDER_RESPONSE',
        };
      }

      const fetchedAt = new Date().toISOString();
      const records: MarketPriceRecord[] = [];

      // Record-by-Record Normalization Pipeline
      for (const raw of json.records) {
        try {
          const commodity = String(raw.commodity || '').trim();
          const state = String(raw.state || '').trim();
          const district = String(raw.district || '').trim();
          const market = String(raw.market || '').trim();
          const variety = String(raw.variety || 'Other').trim();
          const grade = String(raw.grade || 'FAQ').trim();
          const rawArrivalDate = String(raw.arrival_date || '').trim();

          const minPrice = parseFloat(raw.min_price);
          const maxPrice = parseFloat(raw.max_price);
          const modalPrice = parseFloat(raw.modal_price);

          // Validation rules
          if (
            !commodity ||
            !state ||
            !market ||
            !Number.isFinite(modalPrice) ||
            modalPrice <= 0 ||
            !Number.isFinite(minPrice) ||
            !Number.isFinite(maxPrice)
          ) {
            continue; // Skip malformed individual record safely
          }

          const priceDate = parseArrivalDate(rawArrivalDate);
          const pricePerKg = Math.round((modalPrice / 100) * 10) / 10;
          const id = `${state}-${district}-${market}-${commodity}-${variety}-${rawArrivalDate}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');

          records.push({
            id,
            commodity,
            variety,
            grade,
            state,
            district,
            market,
            minPrice: Math.round(minPrice),
            maxPrice: Math.round(maxPrice),
            modalPrice: Math.round(modalPrice),
            pricePerKg,
            unit: '₹/quintal',
            priceDate,
            rawArrivalDate,
            change: null,
            trend: 'NONE',
            cropImage: getCropImage(commodity),
            source: 'Government of India OGD / AGMARKNET',
            sourceTimestamp: json.updated_date || fetchedAt,
            fetchedAt,
          });
        } catch (itemErr) {
          // Skip item errors safely
          continue;
        }
      }

      return {
        success: true,
        total: json.total || records.length,
        records,
        updatedDate: json.updated_date || fetchedAt,
      };
    } catch (err: any) {
      console.warn('[DataGovMarketProvider] Fetch failed:', err.message);
      return {
        success: false,
        total: 0,
        records: [],
        error: err.message || 'FETCH_TIMEOUT_OR_NETWORK_ERROR',
      };
    }
  }
}

export const activeDataGovProvider = new DataGovMarketProvider();
