-- AI MANDI — Migration 001: Initial Core Schema & Types
-- Matches docs/DATABASE-DESIGN.md

-- 1. Custom Enumerated Types
CREATE TYPE user_role AS ENUM ('FARMER', 'BUYER', 'TRANSPORTER', 'FPO_ADMIN');
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'LOW_STOCK', 'ORDER_RECEIVED', 'SOLD_OUT', 'EXPIRED', 'INACTIVE');
CREATE TYPE order_status AS ENUM ('PLACED', 'ACCEPTED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');
CREATE TYPE shipment_status AS ENUM ('SCHEDULED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');
CREATE TYPE transport_status AS ENUM ('REQUESTED', 'BROADCAST', 'ACCEPTED', 'DRIVER_ASSIGNED', 'PICKUP_STARTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'REJECTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE freshness_status AS ENUM ('SAFE', 'AT_RISK', 'INELIGIBLE');
CREATE TYPE payment_status AS ENUM ('PENDING', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED', 'FAILED');

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FARMER',
    location_name VARCHAR(255),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Farmer Profiles Table
CREATE TABLE farmer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    father_or_husband_name VARCHAR(255),
    village VARCHAR(100) NOT NULL,
    post_office VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
    pincode VARCHAR(10),
    land_hectares NUMERIC(6, 2) DEFAULT 0.5,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FPO Profiles Table
CREATE TABLE fpo_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    admin_user_id UUID REFERENCES users(id) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    member_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FPO Memberships Table
CREATE TABLE fpo_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID REFERENCES fpo_profiles(id) ON DELETE CASCADE NOT NULL,
    farmer_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fpo_id, farmer_user_id)
);

-- 6. Produce Listings Table
CREATE TABLE produce_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Vegetables',
    total_quantity NUMERIC(10, 2) NOT NULL,
    available_quantity NUMERIC(10, 2) NOT NULL,
    reserved_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sold_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    grade VARCHAR(10) NOT NULL DEFAULT 'A',
    harvest_date DATE NOT NULL,
    shelf_life_days INT NOT NULL,
    status listing_status NOT NULL DEFAULT 'ACTIVE',
    location_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Buyer Demands Table
CREATE TABLE buyer_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    target_quantity_kg NUMERIC(10, 2) NOT NULL,
    target_price_per_kg NUMERIC(10, 2) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) UNIQUE NOT NULL,
    listing_id UUID REFERENCES produce_listings(id) NOT NULL,
    buyer_id UUID REFERENCES users(id) NOT NULL,
    farmer_id UUID REFERENCES users(id) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    product_amount NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'PLACED',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transport Requests Table
CREATE TABLE transport_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    transporter_id UUID REFERENCES users(id),
    fare_amount NUMERIC(10, 2) NOT NULL,
    distance_km NUMERIC(10, 2) NOT NULL,
    status transport_status NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Shipments Table
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    transporter_id UUID REFERENCES users(id),
    status shipment_status NOT NULL DEFAULT 'SCHEDULED',
    pickup_address VARCHAR(255) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    pickup_lat NUMERIC(10, 8) NOT NULL,
    pickup_lng NUMERIC(11, 8) NOT NULL,
    delivery_lat NUMERIC(10, 8) NOT NULL,
    delivery_lng NUMERIC(11, 8) NOT NULL,
    delivery_otp VARCHAR(6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    payer_id UUID REFERENCES users(id) NOT NULL,
    payee_id UUID REFERENCES users(id) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('PRODUCT_PAYMENT', 'DELIVERY_FEE')),
    status payment_status NOT NULL DEFAULT 'HELD_IN_ESCROW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Market Prices Table
CREATE TABLE market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    mandi_name VARCHAR(255) NOT NULL,
    modal_price_per_kg NUMERIC(10, 2) NOT NULL,
    min_price_per_kg NUMERIC(10, 2) NOT NULL,
    max_price_per_kg NUMERIC(10, 2) NOT NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE
);
