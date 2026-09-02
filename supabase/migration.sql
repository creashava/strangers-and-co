-- ============================================================
-- Early-Bird UPI Payment System — Supabase SQL Migration
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Custom Enums
-- ============================================================
DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('reserved', 'verified', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_tier AS ENUM ('early_bird', 'regular');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- 2. Registrations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL DEFAULT 'PENDING',
    email           TEXT NOT NULL DEFAULT 'PENDING',
    phone           TEXT NOT NULL DEFAULT 'PENDING',
    tier            ticket_tier NOT NULL,
    amount_paid     NUMERIC(6,2) NOT NULL,
    utr_number      TEXT UNIQUE,
    screenshot_url  TEXT,
    status          registration_status DEFAULT 'reserved',
    reserved_at     TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_registrations_tier_status
    ON registrations(tier, status);

CREATE INDEX IF NOT EXISTS idx_registrations_utr
    ON registrations(utr_number);

CREATE INDEX IF NOT EXISTS idx_registrations_expires_at
    ON registrations(expires_at)
    WHERE status = 'reserved';


-- 4. Atomic Slot Reservation Function (Race-Condition Safe)
-- ============================================================
-- Uses SELECT COUNT(*) ... FOR UPDATE to lock rows during the
-- transaction, preventing concurrent over-allocation.
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_slot(
    p_tier ticket_tier,
    p_timeout_minutes INT DEFAULT 7
)
RETURNS TABLE (
    success         BOOLEAN,
    reservation_id  UUID,
    slots_left      INT,
    tier_assigned    ticket_tier,
    amount          NUMERIC(6,2),
    message         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_count  INT;
    v_total_active  INT;
    v_new_id        UUID;
    v_slots_left    INT;
    v_tier          ticket_tier;
    v_amount        NUMERIC(6,2);
BEGIN
    -- Acquire atomic transaction lock to eliminate race conditions
    PERFORM pg_advisory_xact_lock(hashtext('event_slot_reservation_lock'));

    -- Step 1: Expire stale reservations (cleanup)
    UPDATE registrations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'reserved' AND expires_at < NOW();

    -- Step 2: Handle based on requested tier
    IF p_tier = 'early_bird' THEN
        -- Count active early bird slots
        SELECT COUNT(*) INTO v_active_count
        FROM registrations
        WHERE tier = 'early_bird'
          AND status IN ('reserved', 'verified');

        IF v_active_count >= 10 THEN
            -- Early bird full — check if we can fallback to regular
            SELECT COUNT(*) INTO v_total_active
            FROM registrations
            WHERE status IN ('reserved', 'verified');

            IF v_total_active >= 40 THEN
                RETURN QUERY SELECT
                    FALSE, NULL::UUID, 0::INT, NULL::ticket_tier, NULL::NUMERIC(6,2),
                    'Event is completely sold out.'::TEXT;
                RETURN;
            END IF;

            -- Auto-fallback to regular tier
            RETURN QUERY SELECT
                FALSE, NULL::UUID, (10 - v_active_count)::INT, 'regular'::ticket_tier, 249.00::NUMERIC(6,2),
                'Early bird slots are filled. Regular tickets at ₹249 are still available.'::TEXT;
            RETURN;
        END IF;

        v_tier := 'early_bird';
        v_amount := 199.00;
        v_slots_left := 10 - (v_active_count + 1);

    ELSE
        -- Regular tier: check total capacity
        SELECT COUNT(*) INTO v_total_active
        FROM registrations
        WHERE status IN ('reserved', 'verified');

        IF v_total_active >= 40 THEN
            RETURN QUERY SELECT
                FALSE, NULL::UUID, 0::INT, NULL::ticket_tier, NULL::NUMERIC(6,2),
                'Event is completely sold out.'::TEXT;
            RETURN;
        END IF;

        v_tier := 'regular';
        v_amount := 249.00;
        v_slots_left := 40 - (v_total_active + 1);
    END IF;

    -- Step 3: Insert the reservation with TTL
    INSERT INTO registrations (tier, amount_paid, status, expires_at, full_name, email, phone)
    VALUES (
        v_tier,
        v_amount,
        'reserved',
        NOW() + (p_timeout_minutes || ' minutes')::INTERVAL,
        'PENDING',
        'PENDING',
        'PENDING'
    )
    RETURNING id INTO v_new_id;

    -- Step 4: Return success
    RETURN QUERY SELECT
        TRUE,
        v_new_id,
        v_slots_left,
        v_tier,
        v_amount,
        ('Slot reserved for ' || p_timeout_minutes || ' minutes. Complete payment now.')::TEXT;
    RETURN;
END;
$$;


-- 5. Complete Registration Function
-- ============================================================
-- Finalizes a reserved slot with user details and UTR.
-- Only succeeds if the reservation is still active (not expired).
-- ============================================================
CREATE OR REPLACE FUNCTION complete_registration(
    p_reservation_id UUID,
    p_full_name      TEXT,
    p_email          TEXT,
    p_phone          TEXT,
    p_utr_number     TEXT,
    p_screenshot_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    success   BOOLEAN,
    message   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status  registration_status;
    v_expires TIMESTAMPTZ;
BEGIN
    -- Check current reservation state
    SELECT status, expires_at INTO v_status, v_expires
    FROM registrations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Reservation not found.'::TEXT;
        RETURN;
    END IF;

    IF v_status != 'reserved' THEN
        RETURN QUERY SELECT FALSE, ('Reservation is no longer active. Current status: ' || v_status::TEXT)::TEXT;
        RETURN;
    END IF;

    IF v_expires < NOW() THEN
        -- Mark as expired
        UPDATE registrations
        SET status = 'expired', updated_at = NOW()
        WHERE id = p_reservation_id;

        RETURN QUERY SELECT FALSE, 'Reservation has expired. Please start a new registration.'::TEXT;
        RETURN;
    END IF;

    -- Check UTR uniqueness (belt-and-suspenders with the UNIQUE constraint)
    IF EXISTS (
        SELECT 1 FROM registrations
        WHERE utr_number = p_utr_number AND id != p_reservation_id
    ) THEN
        RETURN QUERY SELECT FALSE, 'This UTR number has already been used for another registration.'::TEXT;
        RETURN;
    END IF;

    -- Finalize the registration
    UPDATE registrations
    SET full_name       = p_full_name,
        email           = p_email,
        phone           = p_phone,
        utr_number      = p_utr_number,
        screenshot_url  = COALESCE(p_screenshot_url, screenshot_url),
        status          = 'verified',
        expires_at      = NULL,  -- Remove TTL
        updated_at      = NOW()
    WHERE id = p_reservation_id;

    RETURN QUERY SELECT TRUE, 'Registration completed successfully!'::TEXT;
    RETURN;
END;
$$;


-- 6. Get Slot Counts Function (Public, Read-Only)
-- ============================================================
CREATE OR REPLACE FUNCTION get_slot_counts()
RETURNS TABLE (
    early_bird_taken  INT,
    early_bird_total  INT,
    regular_taken     INT,
    total_taken       INT,
    total_capacity    INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_early INT;
    v_total INT;
BEGIN
    -- First expire stale reservations
    UPDATE registrations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'reserved' AND expires_at < NOW();

    SELECT COUNT(*) INTO v_early
    FROM registrations
    WHERE tier = 'early_bird'
      AND status IN ('reserved', 'verified');

    SELECT COUNT(*) INTO v_total
    FROM registrations
    WHERE status IN ('reserved', 'verified');

    RETURN QUERY SELECT
        v_early,
        10::INT,
        (v_total - v_early)::INT,
        v_total,
        40::INT;
END;
$$;


-- 7. Admin: Get All Registrations
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_registrations()
RETURNS SETOF registrations
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM registrations ORDER BY created_at DESC;
$$;


-- 8. Admin: Update Registration Status
-- ============================================================
CREATE OR REPLACE FUNCTION update_registration_status(
    p_id     UUID,
    p_status registration_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE registrations
    SET status = p_status, updated_at = NOW()
    WHERE id = p_id;
END;
$$;


-- 9. Row Level Security
-- ============================================================
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow anon users to call RPC functions (handled by SECURITY DEFINER)
-- Allow service role full access for admin operations
CREATE POLICY "Service role has full access"
    ON registrations FOR ALL
    USING (auth.role() = 'service_role');

-- Allow anon to read slot counts (via RPC, not direct table access)
-- No direct table access for anon users — all through RPC functions


-- 10. Storage Bucket for Screenshots
-- ============================================================
-- Run this in the Supabase Dashboard > Storage > Create Bucket
-- Bucket name: receipts
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policy (run in SQL editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Service role can read receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts' AND auth.role() = 'service_role');
