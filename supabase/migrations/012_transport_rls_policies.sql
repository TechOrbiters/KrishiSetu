-- AI MANDI — Migration 012: Transport & Orders RLS Policies

-- Transport Requests RLS Policies
DROP POLICY IF EXISTS "Allow public read on transport_requests" ON transport_requests;
DROP POLICY IF EXISTS "Allow authenticated insert on transport_requests" ON transport_requests;
DROP POLICY IF EXISTS "Allow authenticated update on transport_requests" ON transport_requests;
DROP POLICY IF EXISTS "Allow authenticated delete on transport_requests" ON transport_requests;

CREATE POLICY "Allow public read on transport_requests" ON transport_requests
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on transport_requests" ON transport_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on transport_requests" ON transport_requests
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on transport_requests" ON transport_requests
    FOR DELETE USING (true);

-- Orders RLS Policies
DROP POLICY IF EXISTS "Allow public read on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated update on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated delete on orders" ON orders;

CREATE POLICY "Allow public read on orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on orders" ON orders
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on orders" ON orders
    FOR DELETE USING (true);
