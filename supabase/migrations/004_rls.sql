-- AI MANDI — Migration 004: Row Level Security (RLS) Policies
-- Note: Authentication is managed via Firebase Auth. Next.js API Routes use the Service Role key
-- for trusted server-side execution. Anon key RLS policies allow public listing views.

ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Public can view active produce listings
CREATE POLICY "Public Read Active Listings" ON produce_listings
    FOR SELECT USING (status IN ('ACTIVE', 'LOW_STOCK'));

-- Public can view market prices
CREATE POLICY "Public Read Market Prices" ON market_prices
    FOR SELECT USING (true);
