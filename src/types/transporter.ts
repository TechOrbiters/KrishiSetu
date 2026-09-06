/**
 * KRISHISETU — Transporter Portal Domain Models & Types
 * Clean, production-ready types aligned with the unified KrishiSetu architecture.
 */

export interface SmartMatchJob {
  id: string;
  order_id: string;
  order_number: string;
  crop_name: string;
  category: string;
  weight_kg: number;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  distance_km: number;
  estimated_duration_mins: number;
  fare_amount: number;
  match_score: number; // 0 - 100%
  match_reasons: string[];
  freshroute_status: 'SAFE' | 'AT_RISK' | 'INELIGIBLE';
  deadline_hours: number;
  created_at: string;
  farmer_name?: string;
  buyer_name?: string;
}

export type TripStatus =
  | 'ACCEPTED'
  | 'HEADING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'NEAR_DESTINATION'
  | 'ARRIVED_AT_DESTINATION'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TransporterTrip {
  id: string; // Transport request or shipment ID
  shipment_id?: string;
  order_id: string;
  order_number: string;
  crop_name: string;
  weight_kg: number;
  fare_amount: number;
  distance_km: number;
  status: TripStatus;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  current_lat?: number;
  current_lng?: number;
  eta_mins?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  farmer_name?: string;
  farmer_phone?: string;
  buyer_name?: string;
  buyer_phone?: string;
  created_at: string;
  updated_at: string;
  timeline: {
    step: string;
    label: string;
    timestamp?: string;
    completed: boolean;
    current: boolean;
  }[];
}

export interface TransporterVehicle {
  id: string;
  transporter_id: string;
  registration_number: string;
  vehicle_type: string;
  model: string;
  capacity_kg: number;
  is_active: boolean;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  created_at: string;
}

export interface TransporterEarningsSummary {
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
  total_earnings: number;
  pending_payouts: number;
  completed_trips_count: number;
  platform_fee: number; // ₹0 under Rule R-001 (100% driver payout)
  transactions: {
    id: string;
    order_id: string;
    order_number: string;
    date: string;
    crop_name: string;
    distance_km: number;
    weight_kg: number;
    gross_amount: number;
    platform_deduction: number;
    net_earnings: number;
    status: 'HELD_IN_ESCROW' | 'RELEASED' | 'SETTLED' | 'PENDING';
  }[];
}

export interface TransporterRatingOverview {
  overall_rating: number; // e.g. 4.9
  total_reviews: number;
  stars_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  metrics: {
    punctuality: number; // percentage or out of 5
    produce_handling: number;
    communication: number;
  };
  reviews: {
    id: string;
    reviewer_name: string;
    reviewer_role: 'FARMER' | 'BUYER' | 'FPO';
    rating: number;
    review_text: string;
    order_number?: string;
    created_at: string;
  }[];
}

export interface TransporterProfileData {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  capacity_kg: number;
  availability: boolean;
  rating: number;
  location_name: string;
  latitude: number;
  longitude: number;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  total_completed_trips: number;
}
