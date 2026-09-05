-- AI MANDI — Migration 010: Enable Row Level Security (RLS) on all public tables
-- Clears all 13 Supabase Security Advisor critical warnings

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_lot_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Note: The Next.js API server connects securely via SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS for trusted server-side RBAC execution while blocking
-- unauthorized client-side anon queries.
