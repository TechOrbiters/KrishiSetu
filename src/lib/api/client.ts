/**
 * KRISHISETU — Centralized & Typed API Client
 * All Farmer API communication goes through this client.
 * Enforces server verification, auth header injection, typed error handling, and DEMO_MODE toggle.
 */

import { LatLng, RouteResult, validateCoordinates } from "../maps/types";
import { calculateHaversineFallback } from "../maps/routing";
import { MarketPriceQueryFilters, MarketPriceApiResponse, MarketPriceSummaryCard } from "../types/market";
import { getFirebaseBearerToken } from "../firebase/authClient";
import { UserProfile, ProduceItem, OrderItem } from "../seedData";

const IS_DEMO_MODE = typeof process !== 'undefined' && 
  (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true');

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: string;
}

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (typeof window !== 'undefined') {
    return path;
  }
  const baseUrl = process.env.TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Get headers with automatic Firebase Bearer Token injection
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = await getFirebaseBearerToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('krishi_active_role') : null;
      if (storedRole === 'BUYER') {
        headers['Authorization'] = `Bearer demo_token_buyer`;
      } else if (storedRole === 'TRANSPORTER') {
        headers['Authorization'] = `Bearer demo_token_transporter_a`;
      } else if (storedRole === 'ADMIN') {
        headers['Authorization'] = `Bearer demo_token_admin`;
      } else {
        headers['Authorization'] = `Bearer demo_token_farmer`;
      }
    }
  } catch (err) {
    headers['Authorization'] = `Bearer demo_token_farmer`;
  }
  return headers;
}

/* ========================================================================= */
/* 1. FARMER PROFILE & USER AUTH ENDPOINTS                                   */
/* ========================================================================= */

export async function fetchFarmerProfile(): Promise<ApiResult<{ user: UserProfile }>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/users/me'), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    
    const dbUser = json.user;
    const profile = json.profile || {};
    const formattedUser: UserProfile = {
      id: dbUser.id || 'usr_farmer',
      fullName: dbUser.full_name || 'Kisan Partner',
      fatherOrSpouseName: profile.father_or_husband_name || '',
      phone: dbUser.phone || '9876543210',
      dob: '15/06/1985',
      gender: 'पुरुष',
      role: 'FARMER_FPO',
      entityKind: 'farmer',
      verificationStatus: profile.verification_status || 'PENDING',
      aadhaarLast4: profile.aadhaar_last4 || '1234',
      registrationDate: dbUser.created_at ? new Date(dbUser.created_at).toLocaleDateString('hi-IN') : '2024-05-20',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300',
      village: profile.village || 'Barabanki',
      postOffice: profile.post_office || 'Barabanki',
      district: profile.district || 'Barabanki',
      state: profile.state || 'Uttar Pradesh',
      pincode: profile.pincode || '221204',
    };

    return { success: true, data: { user: formattedUser }, source: json.source };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch profile' };
  }
}

export async function updateFarmerProfile(updates: Partial<UserProfile>): Promise<ApiResult<UserProfile>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/users/me'), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        full_name: updates.fullName,
        village: updates.village,
        district: updates.district,
        state: updates.state,
        father_or_husband_name: updates.fatherOrSpouseName,
        post_office: updates.postOffice,
        pincode: updates.pincode,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: updates as UserProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile' };
  }
}

export async function bootstrapFarmer(data: { full_name?: string; village?: string; district?: string; state?: string }): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/auth/bootstrap'), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to bootstrap profile' };
  }
}

/* ========================================================================= */
/* 2. FARMER PRODUCE LISTINGS ENDPOINTS                                      */
/* ========================================================================= */

export async function fetchFarmerListings(farmerId?: string): Promise<ApiResult<ProduceItem[]>> {
  try {
    const headers = await getAuthHeaders();
    const url = farmerId ? `/api/listings?farmerId=${encodeURIComponent(farmerId)}` : '/api/listings';
    const res = await fetch(getApiUrl(url), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }

    const rawListings = json.listings || [];
    const formattedListings: ProduceItem[] = rawListings.map((item: any) => ({
      id: item.id,
      farmerId: item.farmer_id || '',
      cropNameHindi: item.crop_name || 'उपज',
      cropNameEnglish: item.crop_name_english || item.crop_name || 'Produce',
      category: item.category || 'सब्जी',
      quantityKg: Number(item.total_quantity || item.quantity || 0),
      availableQtyKg: Number(item.available_quantity || item.quantity || 0),
      minOrderQtyKg: Number(item.min_order_quantity || 10),
      unit: 'kg',
      grade: item.grade || 'A',
      askingPricePerKg: Number(item.price_per_kg || 0),
      marketPriceRange: `₹${item.price_per_kg || 20} - ₹${(item.price_per_kg || 20) + 4} / kg`,
      freshnessWindowHours: Number(item.shelf_life_days ? item.shelf_life_days * 24 : 24),
      harvestDate: item.harvest_date || new Date().toISOString(),
      locationVillage: item.location_name ? item.location_name.split(',')[0] : 'बाराबंकी',
      locationDistrict: item.location_name ? item.location_name.split(',')[1] || 'बाराबंकी' : 'बाराबंकी',
      locationState: 'उत्तर प्रदेश',
      availability: 'TODAY',
      status: item.status === 'INACTIVE' ? 'PAUSED' : (item.status || 'ACTIVE'),
      viewsCount: Number(item.views_count || 0),
      ordersCount: Number(item.orders_count || 0),
      updatedAt: item.updated_at || new Date().toISOString(),
      imageUrl: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    }));

    return { success: true, data: formattedListings, source: json.source };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch listings' };
  }
}

export async function createFarmerListing(payload: any): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/listings'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || json.details || `HTTP ${res.status}` };
    }
    const listing = json.data || json.listing;
    return { success: true, data: listing };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create listing' };
  }
}

export const createListing = createFarmerListing;

export async function fetchListingById(id: string): Promise<ApiResult<ProduceItem>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/listings/${id}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success || (!json.listing && !json.data)) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    const item = json.data || json.listing;
    const formatted: ProduceItem = {
      id: item.id,
      farmerId: item.farmer_id || 'farmer_101',
      cropNameHindi: item.crop_name || 'टमाटर',
      cropNameEnglish: item.crop_name_english || item.crop_name || 'Tomato',
      category: item.category || 'सब्जी',
      quantityKg: Number(item.total_quantity || item.quantity || 100),
      availableQtyKg: Number(item.available_quantity || item.quantity || 100),
      minOrderQtyKg: Number(item.min_order_quantity || 10),
      unit: 'kg',
      grade: item.grade || 'A',
      askingPricePerKg: Number(item.price_per_kg || 20),
      marketPriceRange: '₹20 - ₹24 / kg',
      freshnessWindowHours: Number(item.shelf_life_days ? item.shelf_life_days * 24 : 24),
      harvestDate: item.harvest_date || new Date().toISOString(),
      locationVillage: item.location_name ? item.location_name.split(',')[0] : 'बाराबंकी',
      locationDistrict: item.location_name ? item.location_name.split(',')[1] || 'बाराबंकी' : 'बाराबंकी',
      locationState: 'उत्तर प्रदेश',
      availability: 'TODAY',
      status: item.status === 'INACTIVE' ? 'PAUSED' : (item.status || 'ACTIVE'),
      viewsCount: Number(item.views_count || 0),
      ordersCount: Number(item.orders_count || 0),
      updatedAt: item.updated_at || new Date().toISOString(),
      imageUrl: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    };
    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch listing' };
  }
}

export async function updateFarmerListing(id: string, updates: any): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/listings/${id}`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.listing };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update listing' };
  }
}

export async function deleteFarmerListing(id: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/listings/${id}`), {
      method: 'DELETE',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete listing' };
  }
}

export async function pauseFarmerListing(id: string, currentStatus: string): Promise<ApiResult<any>> {
  const newStatus = currentStatus === 'PAUSED' || currentStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
  return updateFarmerListing(id, { status: newStatus });
}

/* ========================================================================= */
/* 3. FARMER ORDERS & ACCEPTANCE ENDPOINTS                                   */
/* ========================================================================= */

export async function fetchFarmerOrders(): Promise<ApiResult<OrderItem[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/orders'), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }

    const rawOrders = json.orders || [];
    const formattedOrders: OrderItem[] = rawOrders.map((ord: any) => ({
      id: ord.id || `ord_${Date.now()}`,
      orderNumber: ord.order_number || `ORD-${Date.now()}`,
      listingId: ord.listing_id || '',
      buyerId: ord.buyer_id || '',
      buyerName: ord.buyer_name || (ord.destination_address ? ord.destination_address.split(',')[0] : 'खरीदार'),
      buyerLocation: ord.destination_address || ord.buyer_location || 'लखनऊ मंडी, यूपी',
      buyerType: ord.buyer_type || 'RETAILER',
      cropNameHindi: ord.produce_listings?.crop_name || ord.listings?.crop_name || ord.crop_name || 'उपज',
      cropNameEnglish: ord.produce_listings?.crop_name_english || ord.listings?.crop_name_english || ord.crop_name_english || 'Produce',
      quantityKg: Number(ord.quantity || 0),
      unitPrice: Number(ord.unit_price || ord.produce_listings?.price_per_kg || 0),
      productPricePerKg: Number(ord.unit_price || ord.produce_listings?.price_per_kg || 0),
      productAmount: Number(ord.product_amount || (ord.quantity * ord.unit_price) || 0),
      deliveryCharge: Number(ord.delivery_fee || 0),
      buyerTotal: Number(ord.total_amount || ord.product_amount || 0),
      deliveryMode: ord.delivery_mode || 'DELIVERY_PARTNER',
      status: ord.status || 'PLACED',
      createdAt: ord.created_at || new Date().toISOString(),
      acceptDeadline: ord.expires_at || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    }));

    return { success: true, data: formattedOrders, source: json.source };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch orders' };
  }
}

export async function createBuyerOrder(payload: any, idempotencyKey?: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await fetch(getApiUrl('/api/orders'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.order, source: json.source };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create order' };
  }
}

export async function fetchOrderById(orderId: string): Promise<ApiResult<OrderItem>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/orders/${orderId}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success || !json.order) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    const ord = json.order;
    const formatted: OrderItem = {
      id: ord.id,
      orderNumber: ord.order_number || `ORD-${ord.id?.slice(0, 8) || ''}`,
      listingId: ord.listing_id || '',
      buyerId: ord.buyer_id || 'buyer_1',
      buyerName: ord.buyer_name || 'लखनऊ सब्जी मंडी बयार',
      buyerLocation: ord.destination_address || ord.buyer_location || 'लखनऊ मंडी, यूपी',
      buyerType: ord.buyer_type || 'RETAILER',
      cropNameHindi: ord.produce_listings?.crop_name || ord.listings?.crop_name || ord.crop_name || 'उपज',
      cropNameEnglish: ord.produce_listings?.crop_name_english || ord.listings?.crop_name_english || ord.crop_name_english || 'Produce',
      quantityKg: Number(ord.quantity || 100),
      unitPrice: Number(ord.unit_price || ord.produce_listings?.price_per_kg || 22),
      productPricePerKg: Number(ord.unit_price || ord.produce_listings?.price_per_kg || 22),
      productAmount: Number(ord.product_amount || (ord.quantity * ord.unit_price)),
      deliveryCharge: Number(ord.delivery_fee || 0),
      buyerTotal: Number(ord.total_amount || ord.product_amount),
      deliveryMode: ord.delivery_mode || 'DELIVERY_PARTNER',
      status: ord.status || 'PLACED',
      createdAt: ord.created_at || new Date().toISOString(),
      acceptDeadline: ord.expires_at || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };
    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch order' };
  }
}

export async function acceptFarmerOrder(orderId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/orders/${orderId}/accept`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.order };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept order' };
  }
}

export async function rejectFarmerOrder(orderId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/orders/${orderId}/reject`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.order };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject order' };
  }
}

export async function cancelOrder(orderId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/orders/${orderId}/cancel`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.order };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cancel order' };
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ApiResult<any>> {
  if (status === 'ACCEPTED') return acceptFarmerOrder(orderId);
  if (status === 'REJECTED' || status === 'CANCELLED') return rejectFarmerOrder(orderId);
  return { success: false, error: 'Invalid status action. Use explicit accept or reject API routes.' };
}

/* ========================================================================= */
/* 4. LOCATION ROUTING & MARKET PRICES                                       */
/* ========================================================================= */

// Simple in-memory cache for recent route queries (TTL: 60 seconds)
const routeCache = new Map<string, { result: RouteResult; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(destination.lat, destination.lng)) {
    return calculateHaversineFallback(origin, destination);
  }

  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const params = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destLat: destination.lat.toString(),
      destLng: destination.lng.toString(),
    });

    const res = await fetch(getApiUrl(`/api/location/route?${params.toString()}`));
    if (!res.ok) {
      throw new Error(`Route API returned HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      const result: RouteResult = json.data;
      routeCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  } catch (err: any) {
    console.warn('[ApiClient] getRoute error:', err.message);
  }

  const fallback = calculateHaversineFallback(origin, destination);
  routeCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
  return fallback;
}

export async function getMarketPrices(filters: MarketPriceQueryFilters = {}): Promise<MarketPriceApiResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.state) params.append("state", filters.state);
    if (filters.district) params.append("district", filters.district);
    if (filters.market) params.append("market", filters.market);
    if (filters.commodity) params.append("commodity", filters.commodity);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const res = await fetch(getApiUrl(`/api/market-prices?${params.toString()}`));
    if (!res.ok) {
      throw new Error(`Market prices API returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] getMarketPrices error:', err.message);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to market price service.',
      },
    };
  }
}

export async function getMarketPriceSummary(): Promise<{ success: boolean; data?: MarketPriceSummaryCard[] }> {
  try {
    const res = await fetch(getApiUrl('/api/market-prices/summary'));
    if (!res.ok) {
      throw new Error(`Market summary API returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] getMarketPriceSummary error:', err.message);
    return { success: false };
  }
}

export async function syncMarketPrices(state: string = 'Uttar Pradesh'): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(getApiUrl('/api/market-prices/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, limit: 100 }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] syncMarketPrices error:', err.message);
    return { success: false, message: err.message };
  }
}

/* ========================================================================= */
/* 5. TRANSPORTER MARKETPLACE & TRANSPORT REQUEST ENDPOINTS                  */
/* ========================================================================= */

export async function fetchTransporters(): Promise<ApiResult<any[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/transport/transporters'), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.transporters, source: json.source };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch transporters' };
  }
}

export async function fetchTransportRequests(status?: string): Promise<ApiResult<any[]>> {
  try {
    const headers = await getAuthHeaders();
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(getApiUrl(`/api/transport/requests${query}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.requests };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch transport requests' };
  }
}

export async function fetchTransportRequestById(id: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/transport/requests/${id}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch transport request' };
  }
}

export async function createTransportRequest(payload: { order_id: string; fare_amount?: number; distance_km?: number }): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/transport/requests'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create transport request' };
  }
}

export async function acceptTransportRequest(
  requestId: string,
  payload?: { transporter_id?: string; vehicle_capacity_kg?: number }
): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    // Default to transporter bearer token if calling from test / client
    headers['Authorization'] = headers['Authorization'] || `Bearer demo_token_transporter`;

    const res = await fetch(getApiUrl(`/api/transport/requests/${requestId}/accept`), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {}),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept transport request' };
  }
}

export async function rejectTransportRequest(requestId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/transport/requests/${requestId}/reject`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject transport request' };
  }
}

export async function cancelTransportRequest(requestId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/transport/requests/${requestId}/cancel`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.request };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cancel transport request' };
  }
}

/* ========================================================================= */
/* 6. SHIPMENT & DELIVERY WORKFLOW ENDPOINTS                                 */
/* ========================================================================= */

export async function fetchShipments(filters?: { status?: string; order_id?: string; transporter_id?: string }): Promise<ApiResult<any[]>> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.order_id) params.append('order_id', filters.order_id);
    if (filters?.transporter_id) params.append('transporter_id', filters.transporter_id);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(getApiUrl(`/api/shipments${query}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.shipments };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch shipments' };
  }
}

export async function fetchShipmentById(id: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/shipments/${id}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch shipment' };
  }
}

export async function createShipment(payload: any): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/shipments'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: { shipment: json.shipment, route: json.route, freshRoute: json.freshRoute } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create shipment' };
  }
}

export async function updateShipmentStatus(id: string, status: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/shipments/${id}`), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.shipment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update shipment status' };
  }
}

export async function deliverShipment(id: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/shipments/${id}/deliver`), {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.shipment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to deliver shipment' };
  }
}

export async function updateShipmentLocation(id: string, lat: number, lng: number, heading = 0, speed = 0): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/shipments/${id}/location`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ latitude: lat, longitude: lng, heading, speed_kmh: speed }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.telemetry };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update shipment location' };
  }
}

/* ========================================================================= */
/* 7. PAYMENT LEDGER & EARNINGS ENDPOINTS                                    */
/* ========================================================================= */

export async function fetchPaymentLedger(): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/payments/ledger'), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch payment ledger' };
  }
}

export async function settlePayment(orderId: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/payments/settle'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ order_id: orderId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to settle payment' };
  }
}

/* ========================================================================= */
/* 8. NOTIFICATION & FCM ENDPOINTS                                           */
/* ========================================================================= */

export async function fetchNotifications(isRead?: boolean): Promise<ApiResult<any[]>> {
  try {
    const headers = await getAuthHeaders();
    const query = isRead !== undefined ? `?is_read=${isRead}` : '';
    const res = await fetch(getApiUrl(`/api/notifications${query}`), { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.notifications };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch notifications' };
  }
}

export async function registerFcmToken(fcmToken: string, deviceInfo = 'Web Browser'): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/notifications/fcm-token'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcm_token: fcmToken, device_info: deviceInfo }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to register FCM token' };
  }
}

export async function markNotificationRead(id: string): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
      method: 'PATCH',
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.notification };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark notification read' };
  }
}

/* ========================================================================= */
/* 9. FARMER AI ENDPOINTS (Vision, DemandSense, SellSmart, MarketPilot)     */
/* ========================================================================= */

export async function analyzeProduceVision(imageInput: File | string): Promise<ApiResult<any>> {
  try {
    let res: Response;
    if (typeof imageInput !== 'string') {
      const formData = new FormData();
      formData.append('file', imageInput);
      const token = await getFirebaseBearerToken().catch(() => null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      res = await fetch(getApiUrl('/api/ai/vision/analyze'), {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      const headers = await getAuthHeaders();
      res = await fetch(getApiUrl('/api/ai/vision/analyze'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: imageInput }),
      });
    }

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to analyze produce image' };
  }
}

export async function fetchDemandSense(crop: string, location = 'Barabanki'): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/ai/demandsense'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ crop, location }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch DemandSense' };
  }
}

export async function fetchSellSmart(
  crop: string,
  quantityKg: number,
  farmerAskingPrice: number,
  location = 'Barabanki'
): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/ai/sellsmart'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ crop, quantityKg, farmerAskingPrice, location }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch SellSmart' };
  }
}

export async function fetchMarketPilot(
  crop: string,
  freshnessRemainingHours: number,
  quantityKg: number,
  location = 'Barabanki'
): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/ai/marketpilot'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ crop, freshnessRemainingHours, quantityKg, location }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch MarketPilot' };
  }
}/* ========================================================================= */
/* 10. KRISHI AI ASSISTANT + SARVAM VOICE ENDPOINTS                          */
/* ========================================================================= */

export interface KrishiAssistantPayload {
  userQuery: string;
  isVoice?: boolean;
  languageCode?: string;
  userId?: string;
  confirmedAction?: { actionType: string; params: any };
}

export async function callKrishiAssistant(payload: KrishiAssistantPayload): Promise<ApiResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl('/api/ai/krishi-assistant'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error?.message || json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to call Krishi Assistant' };
  }
}

/**
 * Transcribes an audio Blob (from MediaRecorder) via POST /api/ai/speech-to-text
 * Returns { transcript, languageCode, extractedIntent, fallbackUsed }
 */
export async function transcribeAudioBlob(blob: Blob): Promise<ApiResult<any>> {
  try {
    const token = await getFirebaseBearerToken().catch(() => null);
    const formData = new FormData();
    formData.append('file', blob, 'recording.wav');

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(getApiUrl('/api/ai/speech-to-text'), {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error?.message || json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to transcribe audio' };
  }
}

/**
 * 12. WEATHER SERVICE ENDPOINT
 * Fetches live weather data for farmer locations via GET /api/weather
 */
export interface WeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  conditionHindi: string;
  description: string;
  icon: string;
  city: string;
  isLive: boolean;
  timestamp: string;
}

export async function fetchWeatherData(
  lat?: number,
  lon?: number,
  city?: string
): Promise<ApiResult<WeatherData>> {
  try {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());
    if (city) params.append('city', city);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(getApiUrl(`/api/weather${query}`));
    const json = await res.json();

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}: Failed to fetch weather`,
      };
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch weather' };
  }
}



