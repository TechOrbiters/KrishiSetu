-- AI MANDI — Migration 013: Shipments Table Columns, Constraints & RLS Policies

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMPTZ;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS actual_arrival TIMESTAMPTZ;

ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_order_id_key;
ALTER TABLE shipments ADD CONSTRAINT shipments_order_id_key UNIQUE (order_id);

DROP POLICY IF EXISTS "Allow public read on shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated insert on shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated update on shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated delete on shipments" ON shipments;

CREATE POLICY "Allow public read on shipments" ON shipments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on shipments" ON shipments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on shipments" ON shipments
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on shipments" ON shipments
    FOR DELETE USING (true);
