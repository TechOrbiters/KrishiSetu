-- AI MANDI — Migration 008: FPO Lot Aggregation & Member Provenance Tracking

CREATE TABLE fpo_lot_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_profile_id UUID REFERENCES fpo_profiles(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES produce_listings(id) ON DELETE CASCADE NOT NULL,
    farmer_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    contributed_quantity_kg NUMERIC(10, 2) NOT NULL CHECK (contributed_quantity_kg > 0),
    payout_share_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fpo_lot_listing ON fpo_lot_contributions(listing_id);
CREATE INDEX idx_fpo_lot_farmer ON fpo_lot_contributions(farmer_user_id);
