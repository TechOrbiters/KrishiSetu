-- AI MANDI — Migration 003: Core Business Constraints & Data Integrity

-- Produce Listings Constraints
ALTER TABLE produce_listings
    ADD CONSTRAINT chk_total_qty_positive CHECK (total_quantity > 0),
    ADD CONSTRAINT chk_available_qty_non_negative CHECK (available_quantity >= 0),
    ADD CONSTRAINT chk_reserved_qty_non_negative CHECK (reserved_quantity >= 0),
    ADD CONSTRAINT chk_price_positive CHECK (price_per_kg > 0),
    ADD CONSTRAINT chk_shelf_life_positive CHECK (shelf_life_days > 0);

-- Orders Constraints (R-001: Zero Platform Fee, Positive Quantities)
ALTER TABLE orders
    ADD CONSTRAINT chk_order_qty_positive CHECK (quantity > 0),
    ADD CONSTRAINT chk_order_unit_price_positive CHECK (unit_price > 0),
    ADD CONSTRAINT chk_order_product_amount CHECK (product_amount = quantity * unit_price),
    ADD CONSTRAINT chk_order_delivery_fee_non_negative CHECK (delivery_fee >= 0),
    ADD CONSTRAINT chk_order_total_amount CHECK (total_amount = product_amount + delivery_fee);

-- Transport Requests Constraints
ALTER TABLE transport_requests
    ADD CONSTRAINT chk_transport_fare_non_negative CHECK (fare_amount >= 0),
    ADD CONSTRAINT chk_transport_distance_positive CHECK (distance_km > 0);
