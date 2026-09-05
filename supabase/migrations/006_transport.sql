-- AI MANDI — Migration 006: Transport State Machine & Concurrency Control

-- Stored Procedure: Atomic Transport Acceptance preventing double-claim race conditions
CREATE OR REPLACE FUNCTION accept_transport_request(
    p_request_id UUID,
    p_transporter_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_status transport_status;
BEGIN
    -- Acquire ROW LOCK on transport request
    SELECT status INTO v_status
    FROM transport_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_status IS NULL OR v_status NOT IN ('REQUESTED', 'BROADCAST') THEN
        -- Already accepted by another driver or cancelled
        RETURN FALSE;
    END IF;

    -- Assign to driver atomically
    UPDATE transport_requests
    SET transporter_id = p_transporter_id,
        status = 'ACCEPTED'::transport_status,
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
