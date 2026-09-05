/**
 * KRISHISETU — Supabase Database TypeScript Definitions
 * Directly matching docs/DATABASE-DESIGN.md and supabase/migrations/*.sql
 */

export type UserRole = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'FPO_ADMIN';
export type ListingStatus = 'ACTIVE' | 'LOW_STOCK' | 'ORDER_RECEIVED' | 'SOLD_OUT' | 'EXPIRED' | 'INACTIVE';
export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';
export type ShipmentStatus = 'SCHEDULED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export type TransportStatus = 'REQUESTED' | 'BROADCAST' | 'ACCEPTED' | 'DRIVER_ASSIGNED' | 'PICKUP_STARTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type FreshnessStatus = 'SAFE' | 'AT_RISK' | 'INELIGIBLE';
export type PaymentStatus = 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';

export interface DbUser {
  id: string;
  firebase_uid: string;
  phone: string;
  full_name: string;
  role: UserRole;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface DbFarmerProfile {
  id: string;
  user_id: string;
  father_or_husband_name?: string;
  village: string;
  post_office?: string;
  district: string;
  state: string;
  pincode?: string;
  land_hectares: number;
  verification_status: string;
  created_at: string;
}

export interface DbProduceListing {
  id: string;
  farmer_id: string;
  crop_name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  sold_quantity: number;
  price_per_kg: number;
  grade: string;
  harvest_date: string;
  shelf_life_days: number;
  status: ListingStatus;
  location_name: string;
  latitude: number;
  longitude: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  unit_price: number;
  product_amount: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbTransportRequest {
  id: string;
  order_id: string;
  transporter_id?: string;
  fare_amount: number;
  distance_km: number;
  status: TransportStatus;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentLedger {
  id: string;
  order_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  fee_type: 'PRODUCT_PAYMENT' | 'DELIVERY_FEE';
  status: PaymentStatus;
  created_at: string;
}
