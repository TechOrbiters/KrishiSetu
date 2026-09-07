-- AI MANDI — Migration 016: Complete Buyer Entities & RLS Policies
-- Matches docs/BUYER-PORTAL-IMPLEMENTATION.md

-- 1. Buyer Profiles Table
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    business_name VARCHAR(255),
    buyer_type VARCHAR(50) NOT NULL DEFAULT 'CONSUMER',
    gstin VARCHAR(20),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
    default_delivery_pincode VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buyer Saved Delivery Addresses
CREATE TABLE IF NOT EXISTS buyer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Saved Listings / Bookmarks
CREATE TABLE IF NOT EXISTS saved_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES produce_listings(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(buyer_id, listing_id)
);

-- 4. Persistent Shopping Cart Items
CREATE TABLE IF NOT EXISTS buyer_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES produce_listings(id) ON DELETE CASCADE NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(buyer_id, listing_id)
);

-- 5. Market Price Alerts
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    commodity VARCHAR(100) NOT NULL,
    target_price NUMERIC(10, 2) NOT NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'BELOW',
    district VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user ON buyer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_addresses_buyer ON buyer_addresses(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_buyer ON saved_listings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_cart_buyer ON buyer_cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_buyer ON price_alerts(buyer_id);

-- Enable RLS on all buyer entities
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for buyer_profiles
CREATE POLICY "Buyers can read their own profile" ON buyer_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Buyers can update their own profile" ON buyer_profiles
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Policies for buyer_addresses
CREATE POLICY "Buyers can view their own addresses" ON buyer_addresses
    FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Buyers can manage their own addresses" ON buyer_addresses
    FOR ALL USING (auth.uid()::text = buyer_id::text);

-- Policies for saved_listings
CREATE POLICY "Buyers can view saved listings" ON saved_listings
    FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Buyers can bookmark listings" ON saved_listings
    FOR ALL USING (auth.uid()::text = buyer_id::text);

-- Policies for buyer_cart_items
CREATE POLICY "Buyers can view their cart" ON buyer_cart_items
    FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Buyers can modify their cart" ON buyer_cart_items
    FOR ALL USING (auth.uid()::text = buyer_id::text);

-- Policies for price_alerts
CREATE POLICY "Buyers can view their price alerts" ON price_alerts
    FOR SELECT USING (auth.uid()::text = buyer_id::text);

CREATE POLICY "Buyers can manage price alerts" ON price_alerts
    FOR ALL USING (auth.uid()::text = buyer_id::text);
