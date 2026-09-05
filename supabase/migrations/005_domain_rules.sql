-- AI MANDI — Migration 005: Atomic Domain Rule Functions (Inventory Concurrency Control)

-- Stored Procedure: Atomic Inventory Reservation with ROW LOCK (SELECT ... FOR UPDATE)
CREATE OR REPLACE FUNCTION reserve_listing_quantity(
    p_listing_id UUID,
    p_requested_qty NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_available NUMERIC;
BEGIN
    -- Acquire ROW LOCK on target listing to prevent race conditions
    SELECT available_quantity INTO v_available
    FROM produce_listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF v_available IS NULL OR v_available < p_requested_qty THEN
        RETURN FALSE;
    END IF;

    -- Update inventory quantities atomically
    UPDATE produce_listings
    SET available_quantity = available_quantity - p_requested_qty,
        reserved_quantity = reserved_quantity + p_requested_qty,
        status = CASE 
            WHEN (available_quantity - p_requested_qty) = 0 THEN 'SOLD_OUT'::listing_status
            WHEN (available_quantity - p_requested_qty) < 50 THEN 'LOW_STOCK'::listing_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_listing_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: Atomic Inventory Restoration (For Cancelled/Expired Orders)
CREATE OR REPLACE FUNCTION restore_listing_quantity(
    p_listing_id UUID,
    p_restored_qty NUMERIC
) RETURNS VOID AS $$
BEGIN
    UPDATE produce_listings
    SET available_quantity = available_quantity + p_restored_qty,
        reserved_quantity = GREATEST(0, reserved_quantity - p_restored_qty),
        status = CASE 
            WHEN (available_quantity + p_restored_qty) > 0 AND status = 'SOLD_OUT' THEN 'ACTIVE'::listing_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql;
