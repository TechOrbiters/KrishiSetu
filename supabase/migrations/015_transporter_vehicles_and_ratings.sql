-- KRISHISETU — Migration 015: Transporter Vehicles, Shipment Tracking & Ratings

-- 1. Transporter Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL DEFAULT 'Mini Truck (Tata Ace)',
    model VARCHAR(100) DEFAULT 'Tata Ace Gold',
    capacity_kg NUMERIC(10, 2) NOT NULL DEFAULT 1000 CHECK (capacity_kg > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_transporter_vehicle UNIQUE (transporter_id, registration_number)
);

-- 2. Add vehicle_id to shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- 3. Shipment Tracking Telemetry Events Table
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0,
    heading NUMERIC(5, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_TRANSIT',
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ratings & Reviews Table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review_text TEXT,
    punctuality_rating NUMERIC(2, 1) CHECK (punctuality_rating >= 1.0 AND punctuality_rating <= 5.0),
    handling_rating NUMERIC(2, 1) CHECK (handling_rating >= 1.0 AND handling_rating <= 5.0),
    communication_rating NUMERIC(2, 1) CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_transporter_id ON vehicles(transporter_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewee_id ON ratings(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Vehicles Policies
DROP POLICY IF EXISTS "Allow public read of active vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow transporters to manage own vehicles" ON vehicles;

CREATE POLICY "Allow public read of active vehicles" ON vehicles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow transporters to manage own vehicles" ON vehicles
    FOR ALL USING (auth.uid()::text = transporter_id::text);

-- Tracking Policies
DROP POLICY IF EXISTS "Allow public read of shipment tracking" ON shipment_tracking;
DROP POLICY IF EXISTS "Allow authenticated insert of shipment tracking" ON shipment_tracking;

CREATE POLICY "Allow public read of shipment tracking" ON shipment_tracking
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert of shipment tracking" ON shipment_tracking
    FOR INSERT WITH CHECK (true);

-- Ratings Policies
DROP POLICY IF EXISTS "Allow public read of ratings" ON ratings;
DROP POLICY IF EXISTS "Allow authenticated insert of ratings" ON ratings;

CREATE POLICY "Allow public read of ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert of ratings" ON ratings
    FOR INSERT WITH CHECK (true);
