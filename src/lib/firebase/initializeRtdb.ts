/**
 * KrishiSetu — Firebase RTDB Initializer
 * Seeds all cross-portal initial data into Firebase Realtime Database.
 * This ensures all portals (Farmer, Buyer, Transporter, Admin) see live shared data.
 * Called once on first app load; subsequent loads check the seed_version flag.
 */

import { ref, get, set } from 'firebase/database';
import { firebaseRtdb } from './client';

const SEED_VERSION = 'v3';

// ── Realistic UP / Barabanki / Lucknow dataset ─────────────────────────────

const PRODUCE_LISTINGS = {
  prod_1: {
    id: 'prod_1',
    farmerId: 'usr_ramesh',
    crop: 'Wheat',
    cropHindi: 'गेहूँ',
    variety: 'HD-2967',
    category: 'Grains',
    quantityKg: 500,
    availableQtyKg: 500,
    minOrderKg: 50,
    pricePerKg: 22,
    marketPricePerKg: 24,
    quality: 'A',
    harvestDate: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    cultivationLocation: 'बैजनाथपुर, बाराबंकी',
    freshnessWindowHours: 72,
    perishable: false,
    status: 'ACTIVE',
    viewsCount: 45,
    ordersCount: 12,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=300',
    farmerName: 'रामेश्वर प्रसाद',
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    distanceKm: 14,
    rating: 4.9,
    marketPriceRange: '₹22–₹24/kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  prod_2: {
    id: 'prod_2',
    farmerId: 'usr_ramesh',
    crop: 'Potato',
    cropHindi: 'आलू',
    variety: 'Chipsona',
    category: 'Vegetables',
    quantityKg: 300,
    availableQtyKg: 300,
    minOrderKg: 50,
    pricePerKg: 18,
    marketPricePerKg: 20,
    quality: 'A',
    harvestDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    cultivationLocation: 'बैजनाथपुर, बाराबंकी',
    freshnessWindowHours: 48,
    perishable: true,
    status: 'ACTIVE',
    viewsCount: 32,
    ordersCount: 8,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300',
    farmerName: 'रामेश्वर प्रसाद',
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    distanceKm: 14,
    rating: 4.9,
    marketPriceRange: '₹17–₹19/kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  prod_3: {
    id: 'prod_3',
    farmerId: 'usr_ramesh',
    crop: 'Tomato',
    cropHindi: 'टमाटर',
    variety: 'Pusa Ruby',
    category: 'Vegetables',
    quantityKg: 200,
    availableQtyKg: 50,
    minOrderKg: 20,
    pricePerKg: 24,
    marketPricePerKg: 26,
    quality: 'A',
    harvestDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    cultivationLocation: 'बैजनाथपुर, बाराबंकी',
    freshnessWindowHours: 24,
    perishable: true,
    status: 'LOW_STOCK',
    viewsCount: 28,
    ordersCount: 5,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300',
    farmerName: 'रामेश्वर प्रसाद',
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    distanceKm: 14,
    rating: 4.9,
    marketPriceRange: '₹22–₹26/kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  prod_4: {
    id: 'prod_4',
    farmerId: 'usr_ramesh',
    crop: 'Okra',
    cropHindi: 'भिंडी',
    variety: 'Parbhani Kranti',
    category: 'Vegetables',
    quantityKg: 100,
    availableQtyKg: 100,
    minOrderKg: 20,
    pricePerKg: 30,
    marketPricePerKg: 32,
    quality: 'A',
    harvestDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    cultivationLocation: 'बैजनाथपुर, बाराबंकी',
    freshnessWindowHours: 18,
    perishable: true,
    status: 'ACTIVE',
    viewsCount: 20,
    ordersCount: 3,
    image: 'https://images.unsplash.com/photo-1425543103986-22bad73d384a?auto=format&fit=crop&q=80&w=300',
    farmerName: 'रामेश्वर प्रसाद',
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    distanceKm: 14,
    rating: 4.9,
    marketPriceRange: '₹28–₹32/kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  prod_5: {
    id: 'prod_5',
    farmerId: 'usr_ramesh',
    crop: 'Onion',
    cropHindi: 'प्याज',
    variety: 'Nasik Red',
    category: 'Vegetables',
    quantityKg: 400,
    availableQtyKg: 400,
    minOrderKg: 50,
    pricePerKg: 28,
    marketPricePerKg: 30,
    quality: 'B',
    harvestDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    cultivationLocation: 'बैजनाथपुर, बाराबंकी',
    freshnessWindowHours: 72,
    perishable: false,
    status: 'ACTIVE',
    viewsCount: 18,
    ordersCount: 4,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=300',
    farmerName: 'रामेश्वर प्रसाद',
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    distanceKm: 14,
    rating: 4.9,
    marketPriceRange: '₹26–₹30/kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const ORDERS = {
  ord_1245: {
    id: 'ord_1245',
    orderCode: '#ORD1245',
    buyerName: 'कृषि भंडार स्टोर',
    buyerPhone: '+91 98765 12345',
    sellerName: 'रामेश्वर प्रसाद (बाराबंकी FPO)',
    sellerPhone: '+91 98765 43210',
    items: [{ id: 'item_1', listingId: 'prod_1', crop: 'Wheat', cropHindi: 'गेहूँ', quantityKg: 500, pricePerKg: 22, lineAmount: 11000, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=200&q=80' }],
    productAmount: 11000,
    deliveryFee: 1500,
    platformFee: 0,
    totalAmount: 12500,
    status: 'PLACED',
    deliveryMethod: 'DELIVERY_PARTNER',
    placedAt: new Date().toLocaleString('hi-IN'),
    acceptDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    pickupLocation: 'बैजनाथपुर FPO फार्म (बाराबंकी)',
    dropLocation: 'नवीन गल्ला मंडी, लखनऊ',
    distanceKm: 28,
    paymentMethod: 'UPI',
    pickupCoords: { lat: 26.9284, lng: 81.1834 },
    dropCoords: { lat: 26.8524, lng: 80.9412 },
    otp: '4782',
  },
  ord_1243: {
    id: 'ord_1243',
    orderCode: '#ORD1243',
    buyerName: 'फूड प्लाजा',
    buyerPhone: '+91 95432 12345',
    sellerName: 'रामेश्वर प्रसाद (बाराबंकी FPO)',
    sellerPhone: '+91 98765 43210',
    items: [{ id: 'item_2', listingId: 'prod_2', crop: 'Potato', cropHindi: 'आलू', quantityKg: 300, pricePerKg: 18, lineAmount: 5400, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80' }],
    productAmount: 5400,
    deliveryFee: 0,
    platformFee: 0,
    totalAmount: 5400,
    status: 'ACCEPTED',
    deliveryMethod: 'SELF_PICKUP',
    placedAt: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString('hi-IN'),
    acceptDeadline: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    pickupLocation: 'बैजनाथपुर FPO फार्म (बाराबंकी)',
    dropLocation: 'फूड प्लाजा, कानपुर',
    distanceKm: 80,
    paymentMethod: 'UPI',
    pickupCoords: { lat: 26.9284, lng: 81.1834 },
    dropCoords: { lat: 26.4499, lng: 80.3319 },
    otp: '6521',
  },
  ord_1241: {
    id: 'ord_1241',
    orderCode: '#ORD1241',
    buyerName: 'फ्रेश मार्ट सुपर स्टोर',
    buyerPhone: '+91 91234 56789',
    sellerName: 'रामेश्वर प्रसाद (बाराबंकी FPO)',
    sellerPhone: '+91 98765 43210',
    items: [{ id: 'item_3', listingId: 'prod_3', crop: 'Tomato', cropHindi: 'टमाटर', quantityKg: 150, pricePerKg: 24, lineAmount: 3600, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80' }],
    productAmount: 3600,
    deliveryFee: 800,
    platformFee: 0,
    totalAmount: 4400,
    status: 'IN_TRANSIT',
    deliveryMethod: 'DELIVERY_PARTNER',
    placedAt: new Date(Date.now() - 48 * 3600 * 1000).toLocaleString('hi-IN'),
    acceptDeadline: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    pickupLocation: 'बैजनाथपुर FPO फार्म (बाराबंकी)',
    dropLocation: 'फ्रेश मार्ट, हजरतगंज, लखनऊ',
    distanceKm: 22,
    paymentMethod: 'UPI',
    pickupCoords: { lat: 26.9284, lng: 81.1834 },
    dropCoords: { lat: 26.8543, lng: 80.9440 },
    otp: '3341',
  },
};

const TRANSPORTER_TRIPS = {
  trip_001: {
    id: 'trip_001',
    orderCode: '#ORD1245',
    produceName: 'गेहूँ (Wheat)',
    quantityKg: 500,
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    driverName: 'राजेश कुमार',
    vehicleNumber: 'UP 32 AB 1234',
    vehicleType: 'Mini Truck',
    pickupLocation: 'बैजनाथपुर FPO फार्म (बाराबंकी)',
    dropLocation: 'नवीन गल्ला मंडी, लखनऊ',
    distanceKm: 28,
    eta: '45 मिनट',
    fare: 1500,
    pickupWindowHours: 4,
    status: 'AVAILABLE',
    isBestMatch: true,
    freshnessDeadline: '48 घंटे शेष',
    freshnessSafe: true,
    otp: '4782',
    temperature: 22.5,
    rating: 4.8,
    completedTrips: 247,
    pickupCoords: { lat: 26.9284, lng: 81.1834, label: 'बैजनाथपुर FPO' },
    dropCoords: { lat: 26.8524, lng: 80.9412, label: 'नवीन गल्ला मंडी' },
    createdAt: new Date().toISOString(),
  },
  trip_002: {
    id: 'trip_002',
    orderCode: '#ORD1241',
    produceName: 'टमाटर (Tomato)',
    quantityKg: 150,
    fpoName: 'अवध किसान उत्पादक संघ (FPO)',
    driverName: 'मौर्य एग्रो लॉजिस्टिक्स',
    vehicleNumber: 'UP 32 EF 5678',
    vehicleType: 'Pickup 407',
    pickupLocation: 'बैजनाथपुर FPO फार्म (बाराबंकी)',
    dropLocation: 'फ्रेश मार्ट, हजरतगंज, लखनऊ',
    distanceKm: 22,
    eta: '35 मिनट',
    fare: 800,
    pickupWindowHours: 2,
    status: 'IN_TRANSIT',
    isBestMatch: false,
    freshnessDeadline: '12 घंटे शेष',
    freshnessSafe: true,
    otp: '3341',
    temperature: 21.0,
    rating: 4.9,
    completedTrips: 189,
    pickupCoords: { lat: 26.9284, lng: 81.1834, label: 'बैजनाथपुर FPO' },
    dropCoords: { lat: 26.8543, lng: 80.9440, label: 'हजरतगंज, लखनऊ' },
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
};

const MANDI_PRICES = {
  tomato: {
    commodity: 'Tomato',
    commodityHindi: 'टमाटर',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow Mandi',
    minPrice: 1800,
    maxPrice: 2400,
    modalPrice: 2200,
    unit: 'Quintal',
    pricePerKg: 22,
    trend: 'UP',
    changePercent: 8,
    updatedAt: new Date().toISOString(),
  },
  potato: {
    commodity: 'Potato',
    commodityHindi: 'आलू',
    state: 'Uttar Pradesh',
    district: 'Barabanki',
    market: 'Barabanki Mandi',
    minPrice: 1400,
    maxPrice: 1800,
    modalPrice: 1600,
    unit: 'Quintal',
    pricePerKg: 16,
    trend: 'STABLE',
    changePercent: 0,
    updatedAt: new Date().toISOString(),
  },
  onion: {
    commodity: 'Onion',
    commodityHindi: 'प्याज',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow Mandi',
    minPrice: 2500,
    maxPrice: 3200,
    modalPrice: 2800,
    unit: 'Quintal',
    pricePerKg: 28,
    trend: 'UP',
    changePercent: 12,
    updatedAt: new Date().toISOString(),
  },
  wheat: {
    commodity: 'Wheat',
    commodityHindi: 'गेहूं',
    state: 'Uttar Pradesh',
    district: 'Barabanki',
    market: 'Barabanki Mandi',
    minPrice: 2200,
    maxPrice: 2600,
    modalPrice: 2450,
    unit: 'Quintal',
    pricePerKg: 24.5,
    trend: 'STABLE',
    changePercent: 2,
    updatedAt: new Date().toISOString(),
  },
  okra: {
    commodity: 'Okra',
    commodityHindi: 'भिंडी',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow Mandi',
    minPrice: 2800,
    maxPrice: 3500,
    modalPrice: 3000,
    unit: 'Quintal',
    pricePerKg: 30,
    trend: 'DOWN',
    changePercent: -5,
    updatedAt: new Date().toISOString(),
  },
  rice: {
    commodity: 'Rice',
    commodityHindi: 'चावल',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow Mandi',
    minPrice: 2400,
    maxPrice: 2800,
    modalPrice: 2600,
    unit: 'Quintal',
    pricePerKg: 26,
    trend: 'STABLE',
    changePercent: 1,
    updatedAt: new Date().toISOString(),
  },
  cauliflower: {
    commodity: 'Cauliflower',
    commodityHindi: 'फूलगोभी',
    state: 'Uttar Pradesh',
    district: 'Barabanki',
    market: 'Barabanki Mandi',
    minPrice: 1500,
    maxPrice: 2200,
    modalPrice: 1800,
    unit: 'Quintal',
    pricePerKg: 18,
    trend: 'DOWN',
    changePercent: -8,
    updatedAt: new Date().toISOString(),
  },
  garlic: {
    commodity: 'Garlic',
    commodityHindi: 'लहसुन',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Lucknow Mandi',
    minPrice: 4500,
    maxPrice: 6000,
    modalPrice: 5500,
    unit: 'Quintal',
    pricePerKg: 55,
    trend: 'UP',
    changePercent: 15,
    updatedAt: new Date().toISOString(),
  },
};

const WEATHER_DATA = {
  barabanki: {
    city: 'Barabanki',
    cityHindi: 'बाराबंकी',
    temp: 28,
    feelsLike: 31,
    tempMin: 24,
    tempMax: 34,
    humidity: 68,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    conditionHindi: 'आंशिक बादल',
    description: 'हल्के बादल, कृषि के लिए उपयुक्त मौसम',
    icon: '⛅',
    rainChance: 35,
    advisory: 'तोड़ी गई फसल को खुले खेत में न रखें',
    isLive: false,
    updatedAt: new Date().toISOString(),
  },
  lucknow: {
    city: 'Lucknow',
    cityHindi: 'लखनऊ',
    temp: 30,
    feelsLike: 34,
    tempMin: 26,
    tempMax: 36,
    humidity: 72,
    windSpeed: 10,
    condition: 'Clear Sky',
    conditionHindi: 'साफ आकाश',
    description: 'धूप और गर्मी, फसल भंडारण का ध्यान रखें',
    icon: '☀️',
    rainChance: 10,
    advisory: 'सब्जियों को ठंडी जगह रखें',
    isLive: false,
    updatedAt: new Date().toISOString(),
  },
};

const ADMIN_STATS = {
  totalFarmers: 1247,
  totalBuyers: 389,
  totalTransporters: 156,
  activeListings: 423,
  ordersToday: 78,
  revenueToday: 245000,
  totalRevenue: 18750000,
  avgOrderValue: 3141,
  updatedAt: new Date().toISOString(),
};

const BUYER_DEMANDS = {
  demand_1: {
    id: 'demand_1',
    buyerName: 'BigBasket Agri Procurement',
    buyerType: 'PROCESSOR',
    crop: 'Tomato',
    cropHindi: 'टमाटर',
    quantityNeeded: 5000,
    maxPricePerKg: 26,
    location: 'Lucknow',
    deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  demand_2: {
    id: 'demand_2',
    buyerName: 'फूड प्रोसेसिंग इंडिया',
    buyerType: 'PROCESSOR',
    crop: 'Potato',
    cropHindi: 'आलू',
    quantityNeeded: 10000,
    maxPricePerKg: 20,
    location: 'Kanpur',
    deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  demand_3: {
    id: 'demand_3',
    buyerName: 'होटल ताज लखनऊ',
    buyerType: 'HOTEL',
    crop: 'Onion',
    cropHindi: 'प्याज',
    quantityNeeded: 200,
    maxPricePerKg: 32,
    location: 'Lucknow',
    deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
};

/**
 * Seed Firebase RTDB with initial cross-portal data.
 * Only runs if no seed has been applied for the current SEED_VERSION.
 */
export async function initializeRtdbData(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!firebaseRtdb) return;

  try {
    // Check if already seeded with this version
    const versionSnap = await get(ref(firebaseRtdb, 'meta/seedVersion'));
    const existingVersion = versionSnap.val();

    if (existingVersion === SEED_VERSION) {
      // Update timestamps in mandi prices for freshness (simulate real-time)
      const now = new Date().toISOString();
      await set(ref(firebaseRtdb, 'meta/lastHeartbeat'), now);
      return;
    }

    console.log('[KrishiSetu] Seeding Firebase RTDB with initial data...');

    // Seed all data in parallel
    await Promise.all([
      set(ref(firebaseRtdb, 'produceListings'), PRODUCE_LISTINGS),
      set(ref(firebaseRtdb, 'orders'), ORDERS),
      set(ref(firebaseRtdb, 'transporterTrips'), TRANSPORTER_TRIPS),
      set(ref(firebaseRtdb, 'mandiPrices'), MANDI_PRICES),
      set(ref(firebaseRtdb, 'weather'), WEATHER_DATA),
      set(ref(firebaseRtdb, 'adminStats'), ADMIN_STATS),
      set(ref(firebaseRtdb, 'buyerDemands'), BUYER_DEMANDS),
      set(ref(firebaseRtdb, 'meta'), {
        seedVersion: SEED_VERSION,
        seededAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        appVersion: '2.0.0',
        platform: 'firebase-static-hosting',
      }),
    ]);

    console.log('[KrishiSetu] ✅ Firebase RTDB seeded successfully!');
  } catch (err) {
    console.warn('[KrishiSetu] RTDB seed note (non-critical):', err);
  }
}

/**
 * Get mandi prices from RTDB with fallback to embedded data
 */
export async function getMandiPricesFromRtdb(): Promise<any[]> {
  try {
    if (firebaseRtdb) {
      const snap = await get(ref(firebaseRtdb, 'mandiPrices'));
      const val = snap.val();
      if (val) {
        return Object.values(val);
      }
    }
  } catch (err) {
    console.warn('RTDB mandi prices read:', err);
  }
  return Object.values(MANDI_PRICES);
}

/**
 * Get weather from RTDB with fallback
 */
export async function getWeatherFromRtdb(city = 'barabanki'): Promise<any> {
  try {
    if (firebaseRtdb) {
      const snap = await get(ref(firebaseRtdb, `weather/${city.toLowerCase()}`));
      const val = snap.val();
      if (val) return val;
    }
  } catch (err) {
    console.warn('RTDB weather read:', err);
  }
  return WEATHER_DATA[city.toLowerCase() as keyof typeof WEATHER_DATA] || WEATHER_DATA.barabanki;
}

/**
 * Get buyer demands from RTDB
 */
export async function getBuyerDemandsFromRtdb(): Promise<any[]> {
  try {
    if (firebaseRtdb) {
      const snap = await get(ref(firebaseRtdb, 'buyerDemands'));
      const val = snap.val();
      if (val) return Object.values(val);
    }
  } catch (err) {
    console.warn('RTDB buyer demands read:', err);
  }
  return Object.values(BUYER_DEMANDS);
}

/**
 * Get admin stats from RTDB
 */
export async function getAdminStatsFromRtdb(): Promise<any> {
  try {
    if (firebaseRtdb) {
      const snap = await get(ref(firebaseRtdb, 'adminStats'));
      const val = snap.val();
      if (val) return val;
    }
  } catch (err) {
    console.warn('RTDB admin stats read:', err);
  }
  return ADMIN_STATS;
}
