/**
 * KRISHISETU — Seed Data for Farmer/FPO
 * Realistic UP / Barabanki / Lucknow dataset matching all visual UI specs.
 */

export interface UserProfile {
  id: string;
  fullName: string;
  fatherOrSpouseName: string;
  phone: string;
  dob: string;
  gender: string;
  role: 'FARMER_FPO';
  entityKind: 'farmer' | 'fpo';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  aadhaarLast4: string;
  registrationDate: string;
  avatarUrl: string;
  village: string;
  postOffice: string;
  district: string;
  state: string;
  pincode: string;
  fpoName?: string;
  memberCount?: number;
  onTimePct?: number;
}

export interface ProduceItem {
  id: string;
  farmerId: string;
  cropNameHindi: string;
  cropNameEnglish: string;
  category: string;
  quantityKg: number;
  availableQtyKg: number;
  minOrderQtyKg: number;
  unit: string;
  grade: 'A' | 'B' | 'C';
  askingPricePerKg: number;
  marketPriceRange: string;
  freshnessWindowHours: number;
  harvestDate: string;
  locationVillage: string;
  locationDistrict: string;
  locationState: string;
  availability: 'TODAY' | 'TOMORROW' | 'SCHEDULED';
  status: 'ACTIVE' | 'LOW_STOCK' | 'ORDER_RECEIVED' | 'EXPIRED' | 'SOLD_OUT' | 'PAUSED' | 'INACTIVE';
  viewsCount: number;
  ordersCount: number;
  imageUrl: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  listingId: string;
  buyerId?: string;
  unitPrice?: number;
  cropNameHindi: string;
  cropNameEnglish: string;
  quantityKg: number;
  productPricePerKg: number;
  productAmount: number;    // Farmer revenue
  deliveryCharge: number;   // Paid by buyer
  buyerTotal: number;
  buyerName: string;
  buyerLocation: string;
  buyerType: 'RETAILER' | 'HOTEL' | 'PROCESSOR' | 'CONSUMER';
  deliveryMode: 'DELIVERY_PARTNER' | 'SELF_PICKUP';
  status: 'PLACED' | 'ACCEPTED' | 'SELF_PICKUP' | 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  acceptDeadline: string; // 12h countdown
  transporterName?: string;
  transporterPhone?: string;
  vehicleDetails?: string;
  trackingEta?: string;
  distanceKm?: number;
  freshnessRemainingHours?: number;
}

export interface MarketPriceItem {
  id: string;
  cropHindi: string;
  cropEnglish: string;
  mandi: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number; // per quintal
  changeRs: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  imageUrl: string;
}

export interface FPOMemberItem {
  id: string;
  name: string;
  village: string;
  contact: string;
  cropProduced: string;
  totalHarvestKg: number;
  joinedDate: string;
  status: 'ACTIVE' | 'PENDING';
}

export const INITIAL_USER: UserProfile = {
  id: 'usr_ramesh',
  fullName: 'रामेश जी',
  fatherOrSpouseName: 'रामप्रसाद जी',
  phone: '98765 43210',
  dob: '15-08-1982',
  gender: 'पुरुष',
  role: 'FARMER_FPO',
  entityKind: 'farmer',
  verificationStatus: 'VERIFIED',
  aadhaarLast4: '1234',
  registrationDate: '20 मई 2024',
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
  village: 'बैजनाथपुर',
  postOffice: 'बैजनाथपुर',
  district: 'बाराबंकी',
  state: 'उत्तर प्रदेश',
  pincode: '225001',
  fpoName: 'शर्मा एफपीओ (Sharma FPO)',
  memberCount: 250,
  onTimePct: 98,
};

export const INITIAL_PRODUCE: ProduceItem[] = [
  {
    id: 'prod_1',
    farmerId: 'usr_ramesh',
    cropNameHindi: 'गेहूँ',
    cropNameEnglish: 'Wheat',
    category: 'Grains',
    quantityKg: 500,
    availableQtyKg: 500,
    minOrderQtyKg: 50,
    unit: 'kg',
    grade: 'A',
    askingPricePerKg: 22,
    marketPriceRange: '₹22–₹24/kg',
    freshnessWindowHours: 72,
    harvestDate: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    locationVillage: 'बैजनाथपुर',
    locationDistrict: 'बाराबंकी',
    locationState: 'उत्तर प्रदेश',
    availability: 'TODAY',
    status: 'ACTIVE',
    viewsCount: 45,
    ordersCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=300',
    updatedAt: 'आज अपडेट',
  },
  {
    id: 'prod_2',
    farmerId: 'usr_ramesh',
    cropNameHindi: 'आलू',
    cropNameEnglish: 'Potato',
    category: 'Vegetables',
    quantityKg: 300,
    availableQtyKg: 300,
    minOrderQtyKg: 50,
    unit: 'kg',
    grade: 'A',
    askingPricePerKg: 18,
    marketPriceRange: '₹17–₹19/kg',
    freshnessWindowHours: 48,
    harvestDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    locationVillage: 'बैजनाथपुर',
    locationDistrict: 'बाराबंकी',
    locationState: 'उत्तर प्रदेश',
    availability: 'TODAY',
    status: 'ACTIVE',
    viewsCount: 32,
    ordersCount: 8,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300',
    updatedAt: 'आज अपडेट',
  },
  {
    id: 'prod_3',
    farmerId: 'usr_ramesh',
    cropNameHindi: 'टमाटर',
    cropNameEnglish: 'Tomato',
    category: 'Vegetables',
    quantityKg: 200,
    availableQtyKg: 50,
    minOrderQtyKg: 20,
    unit: 'kg',
    grade: 'A',
    askingPricePerKg: 24,
    marketPriceRange: '₹22–₹26/kg',
    freshnessWindowHours: 24,
    harvestDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    locationVillage: 'बैजनाथपुर',
    locationDistrict: 'बाराबंकी',
    locationState: 'उत्तर प्रदेश',
    availability: 'TODAY',
    status: 'LOW_STOCK',
    viewsCount: 28,
    ordersCount: 5,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300',
    updatedAt: '1 दिन पहले',
  },
  {
    id: 'prod_4',
    farmerId: 'usr_ramesh',
    cropNameHindi: 'भिंडी',
    cropNameEnglish: 'Okra',
    category: 'Vegetables',
    quantityKg: 100,
    availableQtyKg: 100,
    minOrderQtyKg: 20,
    unit: 'kg',
    grade: 'A',
    askingPricePerKg: 30,
    marketPriceRange: '₹28–₹32/kg',
    freshnessWindowHours: 18,
    harvestDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    locationVillage: 'बैजनाथपुर',
    locationDistrict: 'बाराबंकी',
    locationState: 'उत्तर प्रदेश',
    availability: 'TODAY',
    status: 'ACTIVE',
    viewsCount: 20,
    ordersCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1425543103986-22bad73d384a?auto=format&fit=crop&q=80&w=300',
    updatedAt: '2 दिन पहले',
  },
  {
    id: 'prod_5',
    farmerId: 'usr_ramesh',
    cropNameHindi: 'प्याज',
    cropNameEnglish: 'Onion',
    category: 'Vegetables',
    quantityKg: 400,
    availableQtyKg: 0,
    minOrderQtyKg: 50,
    unit: 'kg',
    grade: 'B',
    askingPricePerKg: 16,
    marketPriceRange: '₹15–₹18/kg',
    freshnessWindowHours: 48,
    harvestDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    locationVillage: 'बैजनाथपुर',
    locationDistrict: 'बाराबंकी',
    locationState: 'उत्तर प्रदेश',
    availability: 'TODAY',
    status: 'SOLD_OUT',
    viewsCount: 18,
    ordersCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=300',
    updatedAt: '3 दिन पहले',
  },
];

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord_1245',
    orderNumber: 'ORD1245',
    listingId: 'prod_1',
    cropNameHindi: 'गेहूँ',
    cropNameEnglish: 'Wheat',
    quantityKg: 500,
    productPricePerKg: 22,
    productAmount: 11000,
    deliveryCharge: 1500,
    buyerTotal: 12500,
    buyerName: 'कृषि भंडार स्टोर',
    buyerLocation: 'लखनऊ',
    buyerType: 'RETAILER',
    deliveryMode: 'DELIVERY_PARTNER',
    status: 'PLACED',
    createdAt: new Date().toISOString(),
    acceptDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord_1243',
    orderNumber: 'ORD1243',
    listingId: 'prod_2',
    cropNameHindi: 'आलू',
    cropNameEnglish: 'Potato',
    quantityKg: 300,
    productPricePerKg: 18,
    productAmount: 5400,
    deliveryCharge: 0,
    buyerTotal: 5400,
    buyerName: 'फूड प्लाजा',
    buyerLocation: 'कानपुर',
    buyerType: 'HOTEL',
    deliveryMode: 'SELF_PICKUP',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    acceptDeadline: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord_1241',
    orderNumber: 'ORD1241',
    listingId: 'prod_3',
    cropNameHindi: 'टमाटर',
    cropNameEnglish: 'Tomato',
    quantityKg: 200,
    productPricePerKg: 24,
    productAmount: 4800,
    deliveryCharge: 1200,
    buyerTotal: 6000,
    buyerName: 'होटल ग्रीन लीफ',
    buyerLocation: 'लखनऊ',
    buyerType: 'HOTEL',
    deliveryMode: 'DELIVERY_PARTNER',
    status: 'IN_TRANSIT',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    acceptDeadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    transporterName: 'संदीप कुमार',
    transporterPhone: '98123 45678',
    vehicleDetails: 'UP32 AB 1234 (छोटा ट्रक)',
    trackingEta: '05:00 PM (1घं 45मि)',
    distanceKm: 32,
    freshnessRemainingHours: 18.3,
  },
  {
    id: 'ord_1239',
    orderNumber: 'ORD1239',
    listingId: 'prod_4',
    cropNameHindi: 'भिंडी',
    cropNameEnglish: 'Okra',
    quantityKg: 100,
    productPricePerKg: 30,
    productAmount: 3000,
    deliveryCharge: 800,
    buyerTotal: 3800,
    buyerName: 'बीमार्ट स्टोर',
    buyerLocation: 'लखनऊ',
    buyerType: 'RETAILER',
    deliveryMode: 'DELIVERY_PARTNER',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    acceptDeadline: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_MARKET_PRICES: MarketPriceItem[] = [
  {
    id: 'mp_1',
    cropHindi: 'गेंहूं',
    cropEnglish: 'Wheat',
    mandi: 'लखनऊ मंडी',
    minPrice: 2150,
    maxPrice: 2300,
    avgPrice: 2225,
    changeRs: 25,
    trend: 'UP',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'mp_2',
    cropHindi: 'आलू',
    cropEnglish: 'Potato',
    mandi: 'लखनऊ मंडी',
    minPrice: 1350,
    maxPrice: 1550,
    avgPrice: 1450,
    changeRs: -30,
    trend: 'DOWN',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'mp_3',
    cropHindi: 'धान (साधारण)',
    cropEnglish: 'Paddy / Rice',
    mandi: 'लखनऊ मंडी',
    minPrice: 1950,
    maxPrice: 2150,
    avgPrice: 2050,
    changeRs: 18,
    trend: 'UP',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'mp_4',
    cropHindi: 'सरसों',
    cropEnglish: 'Mustard',
    mandi: 'लखनऊ मंडी',
    minPrice: 5150,
    maxPrice: 5550,
    avgPrice: 5350,
    changeRs: 65,
    trend: 'UP',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'mp_5',
    cropHindi: 'टमाटर',
    cropEnglish: 'Tomato',
    mandi: 'लखनऊ मंडी',
    minPrice: 800,
    maxPrice: 1100,
    avgPrice: 950,
    changeRs: -20,
    trend: 'DOWN',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'mp_6',
    cropHindi: 'प्याज',
    cropEnglish: 'Onion',
    mandi: 'लखनऊ मंडी',
    minPrice: 1200,
    maxPrice: 1500,
    avgPrice: 1350,
    changeRs: 10,
    trend: 'UP',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=150',
  },
];

export const INITIAL_FPO_MEMBERS: FPOMemberItem[] = [
  {
    id: 'mem_1',
    name: 'रमेश चंद्र',
    village: 'बैजनाथपुर',
    contact: '98765 11111',
    cropProduced: 'गेहूँ, आलू',
    totalHarvestKg: 850,
    joinedDate: '10 जन 2024',
    status: 'ACTIVE',
  },
  {
    id: 'mem_2',
    name: 'सुरेश यादव',
    village: 'दौलतपुर',
    contact: '98765 22222',
    cropProduced: 'टमाटर, मिर्च',
    totalHarvestKg: 620,
    joinedDate: '15 फर 2024',
    status: 'ACTIVE',
  },
  {
    id: 'mem_3',
    name: 'महेश वर्मा',
    village: 'सुबेहा',
    contact: '98765 33333',
    cropProduced: 'सरसों, चना',
    totalHarvestKg: 1200,
    joinedDate: '01 मार्च 2024',
    status: 'ACTIVE',
  },
  {
    id: 'mem_4',
    name: 'दिनेश सिंह',
    village: 'हैदरगढ़',
    contact: '98765 44444',
    cropProduced: 'धान, प्याज',
    totalHarvestKg: 950,
    joinedDate: '20 अप्रैल 2024',
    status: 'PENDING',
  },
];
