-- AI MANDI — Migration 007: Payment Ledger & Financial Simulation

CREATE TABLE payment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    payer_id UUID REFERENCES users(id) NOT NULL,
    payee_id UUID REFERENCES users(id) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('PRODUCT_PAYMENT', 'DELIVERY_FEE')),
    status payment_status NOT NULL DEFAULT 'HELD_IN_ESCROW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_ledger_order ON payment_ledger(order_id);
