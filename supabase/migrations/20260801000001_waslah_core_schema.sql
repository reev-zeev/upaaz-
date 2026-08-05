-- وُصلة — Core Schema Migration
-- منصة لوجستية ذكية عبر تيليجرام
-- PostgreSQL + Row-Level Security

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Enums
-- ============================================================
CREATE TYPE user_role AS ENUM ('rider', 'driver', 'merchant', 'enterprise', 'admin', 'support', 'dispatcher', 'supervisor');
CREATE TYPE kyc_status AS ENUM ('pending', 'submitted', 'verified', 'rejected', 'suspended');
CREATE TYPE service_type AS ENUM ('ride', 'delivery', 'courier', 'shuttle', 'corporate', 'government');
CREATE TYPE ride_status AS ENUM ('requested', 'dispatching', 'matched', 'arrived', 'started', 'finished', 'cancelled', 'expired', 'failed');
CREATE TYPE subscription_plan AS ENUM ('trial', 'rides', 'delivery', 'combined', 'merchant_basic', 'merchant_premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet', 'stcpay', 'mada', 'applepay');
CREATE TYPE emergency_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE emergency_status AS ENUM ('open', 'acknowledged', 'resolved', 'false_alarm');
CREATE TYPE driver_service_mode AS ENUM ('ride', 'delivery', 'both');

-- ============================================================
-- 3. Core Tables
-- ============================================================

-- 3.1 Users (unified identity for all parties)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    username TEXT,
    role user_role NOT NULL DEFAULT 'rider',
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    language TEXT NOT NULL DEFAULT 'ar',
    last_lat DOUBLE PRECISION,
    last_lon DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);

-- 3.2 Drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    work_area TEXT,
    preferred_areas TEXT[],
    car_model TEXT,
    car_plate TEXT,
    car_color TEXT,
    car_type TEXT,
    privacy_mode TEXT NOT NULL DEFAULT 'open',
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    active_service_mode driver_service_mode NOT NULL DEFAULT 'ride',
    active_ride_id UUID, -- active request lock (nullable unique)
    rating_avg FLOAT NOT NULL DEFAULT 5.0,
    rating_count INT NOT NULL DEFAULT 0,
    total_trips INT NOT NULL DEFAULT 0,
    acceptance_rate FLOAT NOT NULL DEFAULT 1.0,
    last_lat DOUBLE PRECISION,
    last_lon DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_active_ride UNIQUE (active_ride_id)
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_city ON drivers(city);
CREATE INDEX idx_drivers_available ON drivers(is_available) WHERE is_available = TRUE;

-- 3.3 Riders (customers)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    privacy_mode TEXT NOT NULL DEFAULT 'open',
    total_rides INT NOT NULL DEFAULT 0,
    total_cancellations INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_user_id ON riders(user_id);

-- 3.4 Rides / Orders (unified model for all service types)
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES riders(id),
    driver_id UUID REFERENCES drivers(id),
    service_type service_type NOT NULL,
    status ride_status NOT NULL DEFAULT 'requested',
    city_id UUID NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    pickup_label TEXT,
    pickup_address_resolved TEXT,
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    dropoff_label TEXT,
    dropoff_address_resolved TEXT,
    dropoff_contact TEXT,
    parcel_note TEXT,
    route_distance_km FLOAT,
    route_duration_min FLOAT,
    traffic_duration_min FLOAT,
    suggested_fare FLOAT,
    surge_multiplier FLOAT DEFAULT 1.0,
    payment_method payment_method DEFAULT 'cash',
    driver_gender_pref TEXT,
    dispatch_wave INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    cancel_reason TEXT,
    cancelled_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_rides_city_id ON rides(city_id);
CREATE INDEX idx_rides_created_at ON rides(created_at DESC);

-- 3.5 Ride Offers (for dispatch matching)
CREATE TABLE ride_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    distance_km FLOAT,
    eta_minutes FLOAT,
    status TEXT NOT NULL DEFAULT 'pending',
    wave INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT unique_pending_offer UNIQUE (ride_id, driver_id)
);

CREATE INDEX idx_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX idx_offers_driver_id ON ride_offers(driver_id);
CREATE INDEX idx_offers_status ON ride_offers(status);

-- 3.6 Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL,
    subscriber_type TEXT NOT NULL, -- 'driver', 'merchant', 'enterprise'
    plan subscription_plan NOT NULL,
    price_sar INT NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id, subscriber_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expiring ON subscriptions(ends_at) WHERE status = 'active';

-- 3.7 Ratings
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    rater_id UUID NOT NULL,
    ratee_id UUID NOT NULL,
    stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rating UNIQUE (ride_id, rater_id)
);

CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);

-- 3.8 Emergency Alerts
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    reporter_id BIGINT NOT NULL,
    reporter_role TEXT NOT NULL,
    severity emergency_severity NOT NULL DEFAULT 'high',
    status emergency_status NOT NULL DEFAULT 'open',
    description TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    acknowledged_by TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_status ON emergency_alerts(status);

-- 3.9 Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id),
    requester_id BIGINT NOT NULL,
    requester_role TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    subject_type TEXT,
    subject_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- 3.11 Idempotency Keys
CREATE TABLE idempotency_keys (
    key TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at);

-- 3.12 Telegram Processed Updates (for webhook idempotency)
CREATE TABLE telegram_processed_updates (
    update_id BIGINT PRIMARY KEY,
    bot_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_processed ON telegram_processed_updates(processed_at);

-- 3.13 Driver Location History
CREATE TABLE driver_location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_driver_time ON driver_location_history(driver_id, recorded_at DESC);

-- 3.14 Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'telegram',
    title TEXT,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- 3.15 Merchants / Stores
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'store', -- store, restaurant, individual
    commercial_registration TEXT,
    tax_number TEXT,
    city TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.16 Products / Catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_merchant ON products(merchant_id);

-- ============================================================
-- 4. Row-Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: can read own data, admins can read all
CREATE POLICY users_self ON users
    FOR ALL USING (telegram_id = current_setting('app.telegram_id')::bigint);

-- Drivers: can read own data
CREATE POLICY drivers_self ON drivers
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE telegram_id = current_setting('app.telegram_id')::bigint));

-- Rides: rider can see own, driver can see assigned
CREATE POLICY rides_access ON rides
    FOR SELECT USING (
        rider_id IN (SELECT id FROM riders WHERE user_id IN (SELECT id FROM users WHERE telegram_id = current_setting('app.telegram_id')::bigint))
        OR driver_id IN (SELECT id FROM drivers WHERE user_id IN (SELECT id FROM users WHERE telegram_id = current_setting('app.telegram_id')::bigint))
    );

-- ============================================================
-- 5. Functions & RPCs
-- ============================================================

-- 5.1 Atomic ride claim (prevents double-accept)
CREATE OR REPLACE FUNCTION claim_ride(
    _ride_id UUID,
    _driver_id UUID
) RETURNS TABLE(claimed BOOLEAN, rider_telegram_id BIGINT, pickup_lat DOUBLE PRECISION, pickup_lng DOUBLE PRECISION, pickup_label TEXT, dropoff_lat DOUBLE PRECISION, dropoff_lng DOUBLE PRECISION, dropoff_label TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    _ride RECORD;
    _rider RECORD;
BEGIN
    -- Lock the ride row
    SELECT * INTO _ride FROM rides WHERE id = _ride_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::BIGINT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check if ride is still available
    IF _ride.status NOT IN ('requested', 'dispatching') THEN
        RETURN QUERY SELECT false, NULL::BIGINT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check driver is not busy
    IF EXISTS (SELECT 1 FROM drivers WHERE id = _driver_id AND active_ride_id IS NOT NULL) THEN
        RETURN QUERY SELECT false, NULL::BIGINT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Assign ride to driver
    UPDATE rides SET
        driver_id = _driver_id,
        status = 'matched',
        accepted_at = NOW(),
        version = version + 1,
        updated_at = NOW()
    WHERE id = _ride_id;
    
    -- Lock the driver
    UPDATE drivers SET
        active_ride_id = _ride_id,
        is_available = FALSE,
        updated_at = NOW()
    WHERE id = _driver_id;
    
    -- Expire other pending offers
    UPDATE ride_offers SET
        status = 'cancelled',
        responded_at = NOW()
    WHERE ride_id = _ride_id AND status = 'pending';
    
    -- Get rider info
    SELECT u.telegram_id INTO _rider
    FROM riders r
    JOIN users u ON u.id = r.user_id
    WHERE r.id = _ride.rider_id;
    
    RETURN QUERY SELECT
        true,
        _rider.telegram_id,
        _ride.pickup_lat,
        _ride.pickup_lng,
        _ride.pickup_label,
        _ride.dropoff_lat,
        _ride.dropoff_lng,
        _ride.dropoff_label;
END;
$$;

-- 5.2 Find nearby drivers
CREATE OR REPLACE FUNCTION nearby_drivers(
    _lat DOUBLE PRECISION,
    _lng DOUBLE PRECISION,
    _radius_km DOUBLE PRECISION DEFAULT 25,
    _service_type TEXT DEFAULT 'ride',
    _limit INT DEFAULT 5,
    _require_subscription BOOLEAN DEFAULT TRUE,
    _city_id UUID DEFAULT NULL,
    _gender_pref TEXT DEFAULT NULL
) RETURNS TABLE(
    driver_id UUID,
    telegram_id BIGINT,
    full_name TEXT,
    distance_km DOUBLE PRECISION,
    rating_avg FLOAT,
    car_model TEXT,
    car_plate TEXT,
    car_color TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        u.telegram_id,
        u.full_name,
        -- Haversine distance approximation
        6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(d.last_lat - _lat) / 2), 2) +
            COS(RADIANS(_lat)) * COS(RADIANS(d.last_lat)) *
            POWER(SIN(RADIANS(d.last_lng - _lng) / 2), 2)
        )) AS distance_km,
        d.rating_avg,
        d.car_model,
        d.car_plate,
        d.car_color
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    WHERE d.is_available = TRUE
        AND d.active_ride_id IS NULL
        AND d.last_lat IS NOT NULL
        AND d.last_lng IS NOT NULL
        AND (_city_id IS NULL OR d.city = (SELECT city FROM riders WHERE id = _city_id::UUID))
        AND (_require_subscription = FALSE OR EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.subscriber_id = d.id
                AND s.subscriber_type = 'driver'
                AND s.status = 'active'
                AND s.ends_at > NOW()
        ))
    ORDER BY distance_km ASC
    LIMIT _limit;
END;
$$;

-- 5.3 Expire stale rides
CREATE OR REPLACE FUNCTION expire_stale_rides(_older_than_seconds INT DEFAULT 420)
RETURNS TABLE(ride_id UUID, rider_telegram_id BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE rides r
    SET status = 'expired', updated_at = NOW(), version = version + 1
    FROM riders rd
    JOIN users u ON u.id = rd.user_id
    WHERE r.id = rd.id
        AND r.status IN ('requested', 'dispatching')
        AND r.created_at < NOW() - (_older_than_seconds || ' seconds')::INTERVAL
    RETURNING r.id, u.telegram_id;
END;
$$;

-- 5.4 Transition ride with validation
CREATE OR REPLACE FUNCTION transition_ride(
    _ride_id UUID,
    _to_status ride_status,
    _actor_role TEXT DEFAULT 'system',
    _actor_id TEXT DEFAULT NULL,
    _reason TEXT DEFAULT NULL
) RETURNS TABLE(ok BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    _from_status ride_status;
    _valid BOOLEAN;
BEGIN
    SELECT status INTO _from_status FROM rides WHERE id = _ride_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'الرحلة غير موجودة';
        RETURN;
    END IF;
    
    -- Validate transition
    SELECT CASE
        WHEN _from_status = 'requested' AND _to_status IN ('dispatching', 'cancelled', 'expired') THEN true
        WHEN _from_status = 'dispatching' AND _to_status IN ('matched', 'cancelled', 'expired', 'failed') THEN true
        WHEN _from_status = 'matched' AND _to_status IN ('arrived', 'cancelled') THEN true
        WHEN _from_status = 'arrived' AND _to_status IN ('started', 'cancelled') THEN true
        WHEN _from_status = 'started' AND _to_status IN ('finished') THEN true
        ELSE false
    END INTO _valid;
    
    IF NOT _valid THEN
        RETURN QUERY SELECT false, format('انتقال غير مسموح: %s → %s', _from_status, _to_status);
        RETURN;
    END IF;
    
    UPDATE rides SET
        status = _to_status,
        version = version + 1,
        accepted_at = CASE WHEN _to_status = 'matched' THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
        started_at = CASE WHEN _to_status = 'started' THEN COALESCE(started_at, NOW()) ELSE started_at END,
        completed_at = CASE WHEN _to_status = 'finished' THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
        cancelled_at = CASE WHEN _to_status = 'cancelled' THEN COALESCE(cancelled_at, NOW()) ELSE cancelled_at END,
        cancelled_by = CASE WHEN _to_status = 'cancelled' THEN COALESCE(_actor_id, cancelled_by) ELSE cancelled_by END,
        cancel_reason = CASE WHEN _to_status = 'cancelled' THEN COALESCE(_reason, cancel_reason) ELSE cancel_reason END,
        updated_at = NOW()
    WHERE id = _ride_id;
    
    -- Release driver if completed or cancelled
    IF _to_status IN ('finished', 'cancelled', 'expired', 'failed') THEN
        UPDATE drivers SET
            active_ride_id = NULL,
            is_available = TRUE,
            updated_at = NOW()
        WHERE active_ride_id = _ride_id;
    END IF;
    
    RETURN QUERY SELECT true, 'تم بنجاح';
END;
$$;