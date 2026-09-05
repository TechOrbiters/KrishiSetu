-- AI MANDI — Migration 002: Indexes for High Query Performance

-- Indexes on Users
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- Indexes on Produce Listings
CREATE INDEX idx_produce_listings_farmer ON produce_listings(farmer_id);
CREATE INDEX idx_produce_listings_status ON produce_listings(status);
CREATE INDEX idx_produce_listings_crop ON produce_listings(crop_name);

-- Indexes on Orders
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_farmer ON orders(farmer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_expires_at ON orders(expires_at);

-- Indexes on Transport Requests & Shipments
CREATE INDEX idx_transport_requests_order ON transport_requests(order_id);
CREATE INDEX idx_transport_requests_status ON transport_requests(status);
CREATE INDEX idx_shipments_transporter ON shipments(transporter_id);

-- Indexes on Market Prices
CREATE INDEX idx_market_prices_crop_district ON market_prices(crop_name, district);
