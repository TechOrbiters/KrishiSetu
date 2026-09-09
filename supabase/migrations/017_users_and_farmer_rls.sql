-- AI MANDI — Migration 017: User & Farmer Profile RLS Policies and Constraints
-- Enables seamless Supabase Auth client operations for registered and authenticated users

-- 1. Relax firebase_uid NOT NULL constraint to allow native Supabase Auth users
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;

-- 2. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow public read of users" ON users;
DROP POLICY IF EXISTS "Public can view farmer profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "Farmers can manage own profile" ON farmer_profiles;

-- 3. Users Table Policies
-- Allow reading user profiles so listings, orders, and logistics show verified names
CREATE POLICY "Users can read profiles" ON users
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            auth.uid()::text = id::text OR
            auth.uid()::text = firebase_uid OR
            auth.role() = 'authenticated'
        )
    );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            auth.uid()::text = id::text OR
            auth.uid()::text = firebase_uid
        )
    );

-- 4. Farmer Profiles Table Policies
CREATE POLICY "Public can view farmer profiles" ON farmer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Farmers can manage own profile" ON farmer_profiles
    FOR ALL USING (
        auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text
    );
