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

// Map of Hindi/English crop image URLs for rich UI display
const CROP_IMAGES: Record<string, string> = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  gehun: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
  aalu: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=100',
  paddy: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  dhan: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
  chawal: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=100',
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
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  adrak: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=100',
  seb: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=100',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=100',
  kela: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=100',
  brinjal: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=100',
  baingan: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=100',
  cabbage: 'https://images.unsplash.com/photo-1598030343246-e55543c55208?auto=format&fit=crop&q=80&w=100',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&q=80&w=100',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=100',
  gajar: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=100',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=100',
  mirch: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=100',
  lemon: 'https://images.unsplash.com/photo-1534947098675-926ff9d9f584?auto=format&fit=crop&q=80&w=100',
  nimbu: 'https://images.unsplash.com/photo-1534947098675-926ff9d9f584?auto=format&fit=crop&q=80&w=100',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=100',
  makka: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=100',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=100',
  aam: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=100',
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&q=80&w=100',
  papita: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&q=80&w=100',
  peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=100',
  matar: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=100',
  bajra: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=100',
  moong: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
  lentil: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
  masur: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=100',
  groundnut: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&q=80&w=100',
  moongfali: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&q=80&w=100',
  soyabean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=100',
  coriander: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&q=80&w=100',
  dhaniya: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&q=80&w=100',
  turmeric: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  haldi: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100',
  guava: 'https://images.unsplash.com/photo-1536511135899-73f1d2b781a9?auto=format&fit=crop&q=80&w=100',
  orange: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=100',
  mousambi: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=100',
  gur: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&q=80&w=100',
  jaggery: 'https://images.unsplash.com/photo-1589135233689-d49495e865f1?auto=format&fit=crop&q=80&w=100',
};

function cleanString(val: unknown, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val).replace(/\r?\n/g, ' ').trim() || fallback;
}

function getCropImage(commodity: string): string {
  const norm = commodity.toLowerCase();
  for (const [key, url] of Object.entries(CROP_IMAGES)) {
    if (norm.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=100';
}

function parseArrivalDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const clean = dateStr.trim();
  const delimiter = clean.includes('/') ? '/' : clean.includes('-') ? '-' : null;
  if (delimiter) {
    const parts = clean.split(delimiter);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY or DD-MM-YYYY -> YYYY-MM-DD
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  return clean;
}

export class DataGovMarketProvider {
  private resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
  private baseUrl = 'https://api.data.gov.in/resource';

  async fetchPrices(filters: MarketPriceQueryFilters = {}): Promise<DataGovFetchResult> {
    const apiKey =
      process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001ebe9a985b4644cb5728a12ccf6236f06';
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
          const commodity = cleanString(raw.commodity);
          const state = cleanString(raw.state);
          const district = cleanString(raw.district);
          const market = cleanString(raw.market);
          const variety = cleanString(raw.variety, 'Other');
          const grade = cleanString(raw.grade, 'FAQ');
          const rawArrivalDate = cleanString(raw.arrival_date);

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
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

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
