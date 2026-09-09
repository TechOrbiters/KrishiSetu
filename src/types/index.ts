export type UserRole = 'FARMER' | 'FARMER_FPO' | 'BUYER' | 'TRANSPORTER' | 'ADMIN';

export type Language = 'hi' | 'en' | 'bn' | 'mr' | 'ta' | 'te';

export type ListingStatus = 'ACTIVE' | 'LOW_STOCK' | 'ORDER_RECEIVED' | 'EXPIRED' | 'SOLD_OUT';

export interface ProduceListing {
  id: string;
  crop: string;
  cropHindi: string;
  variety?: string;
  quantityKg: number;
  availableQtyKg?: number;
  minOrderKg: number;
  pricePerKg: number;
  marketPricePerKg?: number;
  quality: 'A' | 'B' | 'C';
  harvestDate: string;
  cultivationLocation: string;
  freshnessWindowHours: number;
  perishable: boolean;
  status: ListingStatus;
  viewsCount: number;
  image: string;
  farmerName: string;
  fpoName?: string;
  distanceKm?: number;
  rating?: number;
  category?: string;
  createdVia?: 'MANUAL' | 'VOICE' | 'PHOTO';
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'SELF_PICKUP'
  | 'PACKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItem {
  id: string;
  listingId: string;
  crop: string;
  cropHindi: string;
  quantityKg: number;
  pricePerKg: number;
  lineAmount: number;
  image: string;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  sellerPhone: string;
  items: OrderItem[];
  productAmount: number; // Farmer revenue (NEVER subtracts transport)
  deliveryFee: number;   // Transporter revenue (0 if Self Pick-up)
  platformFee: number;   // Always 0 in MVP
  totalAmount: number;   // productAmount + deliveryFee
  status: OrderStatus;
  deliveryMethod: 'DELIVERY_PARTNER' | 'SELF_PICKUP';
  deliveryOptionName?: string;
  placedAt: string;
  acceptDeadline: string; // 12-hour timer for farmer
  acceptedAt?: string;
  deliveredAt?: string;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  paymentMethod?: 'COD' | 'UPI' | 'NETBANKING' | 'CARD';
  transporterName?: string;
  transporterVehicle?: string;
  transporterPhone?: string;
  eta?: string;
  freshnessRemainingHours?: number;
  cancelledReason?: string;
  rejectionReason?: string;
}

export interface TransporterTrip {
  id: string;
  orderCode: string;
  produceName: string;
  quantityKg: number;
  fpoName: string;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  eta: string;
  fare: number;
  pickupWindowHours: number;
  freshnessRemainingHours?: number;
  status: 'AVAILABLE' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  isBestMatch?: boolean;
  freshnessDeadline: string;
  freshnessSafe: boolean; // FreshRoute check
  pickupCoords?: { lat: number; lng: number; label?: string };
  dropCoords?: { lat: number; lng: number; label?: string };
  currentLocation?: { lat: number; lng: number; lastUpdated?: string; speedKmh?: number; address?: string };
  driverName?: string;
  vehicleNumber?: string;
  otp?: string;
  podOtp?: string;
  temperature?: number;
}

export interface MarketPrice {
  id: string;
  crop: string;
  cropHindi: string;
  mandi: string;
  state?: string;
  district?: string;
  variety?: string;
  grade?: string;
  arrivalDate?: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number; // per quintal
  change: number;
  trend: 'UP' | 'DOWN';
  platformPriceKg: number;
  retailMandiPriceKg: number;
  savingsPercentage: number;
  category: 'VEGETABLES' | 'GRAINS' | 'PULSES' | 'OILSEEDS' | 'FRUITS' | 'COMMODITIES';
  isLive?: boolean;
}

export interface FPOProfile {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  memberCount: number;
  productCount: number;
  onTimeRate: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFPO: boolean; // true = FPO, false = individual farmer
  experienceYears?: number;
  avatar: string;
}

export interface VerificationRequest {
  id: string;
  name: string;
  type: 'FARMER' | 'FPO' | 'BUYER' | 'TRANSPORTER';
  phone: string;
  location: string;
  aadhaarMasked: string; // e.g. "XXXX XXXX 1234"
  date: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface Dispute {
  id: string;
  orderCode: string;
  raisedBy: string;
  role: string;
  category: 'DELIVERY_DELAY' | 'QUALITY' | 'PAYMENT' | 'DAMAGE';
  description: string;
  date: string;
  status: 'OPEN' | 'RESOLVED';
  resolution?: string;
}

export interface BuyerDemand {
  id: string;
  crop: string;
  cropHindi: string;
  quantityKg: number;
  targetPricePerKg: number;
  buyerName: string;
  buyerPhone: string;
  buyerType: 'CONSUMER' | 'BUSINESS' | 'KIRANA' | 'HOTEL_REST';
  deliveryLocation: string;
  expectedDeliveryDate: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED';
  matchedFarmerCount?: number;
  createdAt: string;
  notes?: string;
}

