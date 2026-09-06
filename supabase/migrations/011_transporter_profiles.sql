-- AI MANDI — Migration 011: Transporter Profiles & Vehicle Constraints

CREATE TABLE IF NOT EXISTS transporter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL DEFAULT 'Mini Truck',
    vehicle_number VARCHAR(50) NOT NULL,
    capacity_kg NUMERIC(10, 2) NOT NULL DEFAULT 1000,
    availability BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
    location_name VARCHAR(255) NOT NULL DEFAULT 'Lucknow Mandi',
    latitude NUMERIC(10, 8) DEFAULT 26.8467,
    longitude NUMERIC(11, 8) DEFAULT 80.9462,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transporter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active transporter profiles" ON transporter_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow transporters to manage own profile" ON transporter_profiles
    FOR ALL USING (auth.uid()::text = user_id::text);
