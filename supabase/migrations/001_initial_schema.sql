-- SwiftShield Database Schema
-- Optimized PostgreSQL schema for Supabase
-- Version: 1.0.0

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For geospatial queries

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE platform_type AS ENUM ('blinkit', 'zepto', 'instamart');
CREATE TYPE plan_tier AS ENUM ('starter', 'shield', 'pro');
CREATE TYPE trigger_type AS ENUM ('rainfall', 'extreme_heat', 'flood', 'cold_fog', 'civil_unrest', 'accident');
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE payout_status AS ENUM ('processing', 'completed', 'failed');
CREATE TYPE payout_type AS ENUM ('claim', 'bonus', 'refund', 'wallet_credit');
CREATE TYPE vehicle_type AS ENUM ('bike', 'scooter', 'bicycle');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending', 'paused');
CREATE TYPE disruption_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================================================
-- REFERENCE TABLES (Static Configuration)
-- ============================================================================

-- Plan Tiers Configuration
CREATE TABLE plan_tiers (
    id plan_tier PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    weekly_premium DECIMAL(10,2) NOT NULL,  -- INR
    weekly_cap DECIMAL(10,2) NOT NULL,       -- INR
    hourly_payout DECIMAL(10,2) NOT NULL,    -- INR
    max_hours_per_day INTEGER NOT NULL,
    waiting_period_minutes INTEGER NOT NULL,
    triggers trigger_type[] NOT NULL,        -- Array of supported triggers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger Types Configuration
CREATE TABLE trigger_definitions (
    id VARCHAR(10) PRIMARY KEY,              -- T1, T2, etc.
    trigger_type trigger_type UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    threshold_description VARCHAR(255),
    base_hourly_rate DECIMAL(10,2) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Zones (GPS-based)
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    center_lat DECIMAL(10,8) NOT NULL,
    center_lng DECIMAL(11,8) NOT NULL,
    radius_km DECIMAL(5,2) NOT NULL,
    geom GEOGRAPHY(POINT, 4326),             -- PostGIS point for efficient queries
    is_active BOOLEAN DEFAULT TRUE,
    risk_score DECIMAL(3,2) DEFAULT 0.5,     -- 0.0 to 1.0
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_city ON delivery_zones(city);
CREATE INDEX idx_zones_geom ON delivery_zones USING GIST(geom);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Workers (Primary users - delivery partners)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication (linked to Supabase Auth)
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    platform platform_type NOT NULL,
    profile_image_url TEXT,
    city VARCHAR(100) NOT NULL,
    joined_date DATE DEFAULT CURRENT_DATE,

    -- Location (updated frequently)
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    assigned_zone_id UUID REFERENCES delivery_zones(id),

    -- Work Status
    is_online BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,

    -- Payment
    upi_id VARCHAR(100),

    -- Fraud Prevention
    fraud_score DECIMAL(5,2) DEFAULT 0,      -- 0-100
    cooling_period_until TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_platform ON workers(platform);
CREATE INDEX idx_workers_city ON workers(city);
CREATE INDEX idx_workers_zone ON workers(assigned_zone_id);
CREATE INDEX idx_workers_fraud ON workers(fraud_score);

-- Worker Vehicles
CREATE TABLE worker_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    vehicle_type vehicle_type NOT NULL,
    registration_number VARCHAR(20),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(worker_id, is_primary) -- Only one primary vehicle per worker
);

CREATE INDEX idx_vehicles_worker ON worker_vehicles(worker_id);

-- Worker Weekly Stats (Aggregated for performance)
CREATE TABLE worker_weekly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,

    -- Stats
    total_deliveries INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    active_hours DECIMAL(5,2) DEFAULT 0,
    avg_rating DECIMAL(2,1) DEFAULT 5.0,

    -- Claim tracking
    total_claims INTEGER DEFAULT 0,
    total_claim_amount DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(worker_id, week_start_date)
);

CREATE INDEX idx_weekly_stats_worker ON worker_weekly_stats(worker_id);
CREATE INDEX idx_weekly_stats_week ON worker_weekly_stats(week_start_date);

-- Insurance Subscriptions
CREATE TABLE insurance_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    plan_tier plan_tier NOT NULL REFERENCES plan_tiers(id),

    -- Status
    status subscription_status NOT NULL DEFAULT 'pending',

    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    auto_renewal BOOLEAN DEFAULT TRUE,

    -- Weekly tracking
    week_start_date DATE NOT NULL,
    weekly_claim_total DECIMAL(10,2) DEFAULT 0,

    -- Payment
    premium_paid DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_worker ON insurance_subscriptions(worker_id);
CREATE INDEX idx_subscriptions_status ON insurance_subscriptions(status);
CREATE INDEX idx_subscriptions_validity ON insurance_subscriptions(valid_from, valid_until);

-- Active/Historical Disruptions (Weather events, civil unrest, etc.)
CREATE TABLE disruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_type trigger_type NOT NULL,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,

    -- Severity
    severity disruption_severity NOT NULL,
    description TEXT,

    -- Weather Data (JSONB for flexibility)
    weather_data JSONB DEFAULT '{}',
    -- Example: {"rainfall_mm": 65, "temperature_c": 42, "visibility_m": 100, "official_notice": true}

    -- Source
    data_source VARCHAR(100),  -- "IMD", "OpenWeather", "Manual"

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disruptions_active ON disruptions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_disruptions_type ON disruptions(trigger_type);
CREATE INDEX idx_disruptions_time ON disruptions(start_time, end_time);

-- Disruption-Zone mapping (Many-to-Many)
CREATE TABLE disruption_zones (
    disruption_id UUID NOT NULL REFERENCES disruptions(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
    PRIMARY KEY (disruption_id, zone_id)
);

CREATE INDEX idx_dz_disruption ON disruption_zones(disruption_id);
CREATE INDEX idx_dz_zone ON disruption_zones(zone_id);

-- Claims
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES insurance_subscriptions(id),
    disruption_id UUID REFERENCES disruptions(id),

    -- Trigger Info
    trigger_type trigger_type NOT NULL,

    -- Timing
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Amount
    amount DECIMAL(10,2) NOT NULL,

    -- Status
    status claim_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,

    -- Description
    description TEXT,

    -- Location at time of claim
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    zone_id UUID REFERENCES delivery_zones(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_claims_worker ON claims(worker_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_date ON claims(claim_date);
CREATE INDEX idx_claims_subscription ON claims(subscription_id);
CREATE INDEX idx_claims_disruption ON claims(disruption_id);

-- Claim Verifications (4-Layer Fraud Detection)
CREATE TABLE claim_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID UNIQUE NOT NULL REFERENCES claims(id) ON DELETE CASCADE,

    -- Layer 1: GPS Validation
    gps_valid BOOLEAN,
    gps_distance_km DECIMAL(5,2),

    -- Layer 2: Platform Session
    platform_session_valid BOOLEAN,
    platform_session_data JSONB,

    -- Layer 3: Cooling Period
    cooling_period_clear BOOLEAN,
    last_claim_hours_ago DECIMAL(5,2),

    -- Layer 4: ML Anomaly Detection
    ml_anomaly_score DECIMAL(5,2),  -- 0-100
    ml_model_version VARCHAR(20),
    ml_features JSONB,

    -- Weather Match
    weather_data_match BOOLEAN,
    weather_source VARCHAR(100),

    -- Overall
    overall_valid BOOLEAN NOT NULL,
    verification_notes TEXT,

    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_claim ON claim_verifications(claim_id);
CREATE INDEX idx_verifications_valid ON claim_verifications(overall_valid);

-- Payouts
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(id),

    -- Amount
    amount DECIMAL(10,2) NOT NULL,

    -- Type & Status
    payout_type payout_type NOT NULL,
    status payout_status NOT NULL DEFAULT 'processing',

    -- Description
    description TEXT,

    -- Payment Details
    upi_id VARCHAR(100),
    razorpay_transfer_id VARCHAR(100),
    razorpay_payout_id VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Error handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_payouts_worker ON payouts(worker_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_claim ON payouts(claim_id);
CREATE INDEX idx_payouts_created ON payouts(created_at);

-- Wallet (For paused coverage credits)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

    -- Transaction
    amount DECIMAL(10,2) NOT NULL,  -- Positive = credit, Negative = debit
    balance_after DECIMAL(10,2) NOT NULL,

    -- Type
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,

    -- Reference
    reference_id UUID,  -- Could be claim_id, subscription_id, etc.
    reference_type VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_worker ON wallet_transactions(worker_id);
CREATE INDEX idx_wallet_created ON wallet_transactions(created_at);

-- ============================================================================
-- ANALYTICS & AUDIT TABLES
-- ============================================================================

-- Zone Risk History (For ML models)
CREATE TABLE zone_risk_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,

    -- Date
    record_date DATE NOT NULL,

    -- Risk Metrics
    risk_score DECIMAL(3,2) NOT NULL,
    claim_count INTEGER DEFAULT 0,
    disruption_hours DECIMAL(5,2) DEFAULT 0,
    avg_claim_amount DECIMAL(10,2),

    -- Weather Summary
    weather_summary JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(zone_id, record_date)
);

CREATE INDEX idx_zone_risk_zone ON zone_risk_history(zone_id);
CREATE INDEX idx_zone_risk_date ON zone_risk_history(record_date);

-- Worker Risk Scores (For fraud ML)
CREATE TABLE worker_risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

    -- Score Date
    score_date DATE NOT NULL,

    -- Scores
    overall_risk_score DECIMAL(5,2) NOT NULL,
    claim_frequency_score DECIMAL(5,2),
    location_anomaly_score DECIMAL(5,2),
    timing_anomaly_score DECIMAL(5,2),

    -- Model Info
    model_version VARCHAR(20),
    features_used JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(worker_id, score_date)
);

CREATE INDEX idx_worker_risk_worker ON worker_risk_scores(worker_id);
CREATE INDEX idx_worker_risk_date ON worker_risk_scores(score_date);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID,  -- Could be worker or admin
    user_type VARCHAR(20),  -- 'worker', 'admin', 'system'

    -- What
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,

    -- When
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- IP/Device
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate worker's current week claim total
CREATE OR REPLACE FUNCTION get_worker_weekly_claim_total(p_worker_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    week_start DATE;
    total DECIMAL;
BEGIN
    week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;

    SELECT COALESCE(SUM(amount), 0)
    INTO total
    FROM claims
    WHERE worker_id = p_worker_id
      AND claim_date >= week_start
      AND status IN ('approved', 'paid');

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Check if worker is in cooling period
CREATE OR REPLACE FUNCTION is_worker_in_cooling_period(p_worker_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workers
        WHERE id = p_worker_id
          AND cooling_period_until > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Get active subscription for worker
CREATE OR REPLACE FUNCTION get_active_subscription(p_worker_id UUID)
RETURNS UUID AS $$
DECLARE
    sub_id UUID;
BEGIN
    SELECT id INTO sub_id
    FROM insurance_subscriptions
    WHERE worker_id = p_worker_id
      AND status = 'active'
      AND NOW() BETWEEN valid_from AND valid_until
    ORDER BY valid_until DESC
    LIMIT 1;

    RETURN sub_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON insurance_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disruptions_updated_at
    BEFORE UPDATE ON disruptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_tiers_updated_at
    BEFORE UPDATE ON plan_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_stats_updated_at
    BEFORE UPDATE ON worker_weekly_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Workers can only see their own data
CREATE POLICY "Workers can view own profile"
    ON workers FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Workers can update own profile"
    ON workers FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Workers can view own vehicles"
    ON worker_vehicles FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workers can view own stats"
    ON worker_weekly_stats FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workers can view own subscriptions"
    ON insurance_subscriptions FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workers can view own claims"
    ON claims FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workers can view own verifications"
    ON claim_verifications FOR SELECT
    USING (claim_id IN (
        SELECT id FROM claims
        WHERE worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())
    ));

CREATE POLICY "Workers can view own payouts"
    ON payouts FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Workers can view own wallet"
    ON wallet_transactions FOR SELECT
    USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));

-- Public read access for reference tables
ALTER TABLE plan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan tiers"
    ON plan_tiers FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view trigger definitions"
    ON trigger_definitions FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view delivery zones"
    ON delivery_zones FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view disruptions"
    ON disruptions FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert Plan Tiers
INSERT INTO plan_tiers (id, name, weekly_premium, weekly_cap, hourly_payout, max_hours_per_day, waiting_period_minutes, triggers) VALUES
('starter', 'Starter Shield', 29.00, 500.00, 70.00, 4, 120, ARRAY['rainfall', 'extreme_heat']::trigger_type[]),
('shield', 'Active Shield', 59.00, 1200.00, 85.00, 6, 60, ARRAY['rainfall', 'extreme_heat', 'flood', 'cold_fog']::trigger_type[]),
('pro', 'Pro Shield', 99.00, 2000.00, 100.00, 8, 30, ARRAY['rainfall', 'extreme_heat', 'flood', 'cold_fog', 'civil_unrest', 'accident']::trigger_type[]);

-- Insert Trigger Definitions
INSERT INTO trigger_definitions (id, trigger_type, name, description, threshold_description, base_hourly_rate, icon) VALUES
('T1', 'rainfall', 'Heavy Rainfall', 'Heavy rain disrupting deliveries', '>50mm in 1 hour', 70.00, 'cloud-rain'),
('T2', 'extreme_heat', 'Extreme Heat', 'Dangerous heat conditions', '>42°C official alert', 70.00, 'thermometer'),
('T3', 'flood', 'Urban Flooding', 'Waterlogging and flood conditions', 'Official flood warning', 85.00, 'water'),
('T4', 'cold_fog', 'Dense Fog/Cold', 'Low visibility fog or extreme cold', '<50m visibility or <4°C', 70.00, 'cloud-fog'),
('T5', 'civil_unrest', 'Civil Disruption', 'Bandh, protests, or civil unrest', 'Official advisory issued', 100.00, 'alert-triangle'),
('T6', 'accident', 'Minor Accident', 'Vehicle accident while on delivery', 'Verified accident report', 100.00, 'car');

-- Insert Sample Delivery Zones (Mumbai)
INSERT INTO delivery_zones (name, city, center_lat, center_lng, radius_km, geom, risk_score) VALUES
('Andheri West', 'Mumbai', 19.1365, 72.8296, 3.0, ST_SetSRID(ST_MakePoint(72.8296, 19.1365), 4326), 0.45),
('Bandra', 'Mumbai', 19.0596, 72.8295, 2.5, ST_SetSRID(ST_MakePoint(72.8295, 19.0596), 4326), 0.55),
('Powai', 'Mumbai', 19.1176, 72.9060, 3.0, ST_SetSRID(ST_MakePoint(72.9060, 19.1176), 4326), 0.40),
('Lower Parel', 'Mumbai', 18.9984, 72.8311, 2.0, ST_SetSRID(ST_MakePoint(72.8311, 18.9984), 4326), 0.50);

-- Insert Sample Delivery Zones (Delhi NCR)
INSERT INTO delivery_zones (name, city, center_lat, center_lng, radius_km, geom, risk_score) VALUES
('Connaught Place', 'Delhi', 28.6315, 77.2167, 2.5, ST_SetSRID(ST_MakePoint(77.2167, 28.6315), 4326), 0.60),
('Gurgaon Sector 29', 'Gurgaon', 28.4595, 77.0266, 3.0, ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326), 0.50),
('Noida Sector 18', 'Noida', 28.5706, 77.3219, 3.0, ST_SetSRID(ST_MakePoint(77.3219, 28.5706), 4326), 0.45);

-- Insert Sample Delivery Zones (Bangalore)
INSERT INTO delivery_zones (name, city, center_lat, center_lng, radius_km, geom, risk_score) VALUES
('Koramangala', 'Bengaluru', 12.9352, 77.6245, 2.5, ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326), 0.55),
('Indiranagar', 'Bengaluru', 12.9784, 77.6408, 2.0, ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326), 0.50),
('HSR Layout', 'Bengaluru', 12.9116, 77.6389, 2.5, ST_SetSRID(ST_MakePoint(77.6389, 12.9116), 4326), 0.45);

COMMENT ON TABLE workers IS 'Primary users - delivery partners from Blinkit/Zepto/Instamart';
COMMENT ON TABLE insurance_subscriptions IS 'Weekly insurance plans purchased by workers';
COMMENT ON TABLE claims IS 'Insurance claims triggered by weather events or disruptions';
COMMENT ON TABLE claim_verifications IS '4-layer fraud detection results for each claim';
COMMENT ON TABLE disruptions IS 'Weather events and disruptions that trigger claims';
COMMENT ON TABLE payouts IS 'UPI payouts to workers for approved claims';
