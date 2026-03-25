-- Essential Worker Seed Data for SwiftShield
-- Run after 001_initial_schema.sql
-- Contains: Workers, Vehicles, Subscriptions, Weekly Stats, Zone Assignments

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CLEAR EXISTING WORKER DATA (for re-running)
-- ============================================================================
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE worker_risk_scores CASCADE;
TRUNCATE TABLE zone_risk_history CASCADE;
TRUNCATE TABLE wallet_transactions CASCADE;
TRUNCATE TABLE payouts CASCADE;
TRUNCATE TABLE claim_verifications CASCADE;
TRUNCATE TABLE claims CASCADE;
TRUNCATE TABLE disruption_zones CASCADE;
TRUNCATE TABLE disruptions CASCADE;
TRUNCATE TABLE insurance_subscriptions CASCADE;
TRUNCATE TABLE worker_weekly_stats CASCADE;
TRUNCATE TABLE worker_vehicles CASCADE;
TRUNCATE TABLE workers CASCADE;

-- ============================================================================
-- WORKERS (6 delivery partners)
-- ============================================================================
DO $$
DECLARE
    andheri_id UUID;
    bandra_id UUID;
    powai_id UUID;
    koramangala_id UUID;
BEGIN
    SELECT id INTO andheri_id FROM delivery_zones WHERE name = 'Andheri West' LIMIT 1;
    SELECT id INTO bandra_id FROM delivery_zones WHERE name = 'Bandra' LIMIT 1;
    SELECT id INTO powai_id FROM delivery_zones WHERE name = 'Powai' LIMIT 1;
    SELECT id INTO koramangala_id FROM delivery_zones WHERE name = 'Koramangala' LIMIT 1;

    INSERT INTO workers (id, name, phone, platform, city, joined_date, current_lat, current_lng, assigned_zone_id, is_online, last_active_at, upi_id, fraud_score, cooling_period_until)
    VALUES
      ('11111111-1111-1111-1111-111111111111', 'Rajesh Kumar', '9876543210', 'blinkit', 'Mumbai', '2024-08-15', 19.1365, 72.8296, andheri_id, true, NOW(), 'rajesh.kumar@paytm', 12.5, NULL),
      ('22222222-2222-2222-2222-222222222222', 'Amit Singh', '9111222333', 'blinkit', 'Mumbai', '2024-10-01', 19.0596, 72.8295, bandra_id, false, NOW() - INTERVAL '2 hours', 'amit.singh@upi', 5.0, NULL),
      ('33333333-3333-3333-3333-333333333333', 'Suresh Yadav', '9777888999', 'blinkit', 'Mumbai', '2024-06-20', 19.1176, 72.9060, powai_id, true, NOW(), 'suresh.yadav@gpay', 8.0, NULL),
      ('44444444-4444-4444-4444-444444444444', 'Vikram Patel', '9988776655', 'zepto', 'Bengaluru', '2024-07-10', 12.9352, 77.6245, koramangala_id, true, NOW(), 'vikram.patel@phonepe', 3.0, NULL),
      ('55555555-5555-5555-5555-555555555555', 'Rahul Sharma', '9444555666', 'zepto', 'Bengaluru', '2024-09-05', 12.9352, 77.6245, koramangala_id, false, NOW() - INTERVAL '1 hour', 'rahul.sharma@upi', 45.0, NOW() + INTERVAL '36 hours'),
      ('66666666-6666-6666-6666-666666666666', 'Priya Devi', '9222333444', 'instamart', 'Mumbai', '2024-08-25', 19.0596, 72.8295, bandra_id, true, NOW(), 'priya.devi@paytm', 2.0, NULL);
END $$;

-- ============================================================================
-- WORKER VEHICLES
-- ============================================================================
INSERT INTO worker_vehicles (id, worker_id, vehicle_type, registration_number, is_primary)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'scooter', 'MH02AB1234', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'bike', 'MH02CD5678', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'scooter', 'MH02EF9012', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'bike', 'KA03GH3456', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'scooter', 'KA03IJ7890', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'bicycle', NULL, true);

-- ============================================================================
-- INSURANCE SUBSCRIPTIONS (Active plans for all workers)
-- ============================================================================
INSERT INTO insurance_subscriptions (id, worker_id, plan_tier, status, valid_from, valid_until, auto_renewal, week_start_date, weekly_claim_total, premium_paid, payment_reference)
VALUES
  -- Worker 1 (Rajesh): Active Shield Plan
  ('71111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'shield', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   true, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 59.00, 'pay_RzP1234567'),

  -- Worker 2 (Amit): Active Starter Plan
  ('72222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'starter', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   true, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 29.00, 'pay_RzP2345678'),

  -- Worker 3 (Suresh): Active Shield Plan
  ('73333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'shield', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   false, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 59.00, 'pay_RzP3456789'),

  -- Worker 4 (Vikram): Active Pro Plan
  ('74444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'pro', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   true, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 99.00, 'pay_RzP4567890'),

  -- Worker 5 (Rahul): Active Pro Plan (in cooling period)
  ('75555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'pro', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   true, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 99.00, 'pay_RzP5678901'),

  -- Worker 6 (Priya): Active Shield Plan
  ('76666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'shield', 'active',
   DATE_TRUNC('week', CURRENT_DATE)::TIMESTAMPTZ,
   (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days')::TIMESTAMPTZ,
   true, DATE_TRUNC('week', CURRENT_DATE)::DATE, 0.00, 59.00, 'pay_RzP6789012');

-- ============================================================================
-- WORKER WEEKLY STATS (Current week)
-- ============================================================================
INSERT INTO worker_weekly_stats (id, worker_id, week_start_date, total_deliveries, total_earnings, active_hours, avg_rating, total_claims, total_claim_amount)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', DATE_TRUNC('week', CURRENT_DATE)::DATE, 87, 4350.00, 32.5, 4.8, 0, 0.00),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', DATE_TRUNC('week', CURRENT_DATE)::DATE, 45, 2250.00, 18.0, 4.5, 0, 0.00),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', DATE_TRUNC('week', CURRENT_DATE)::DATE, 112, 5600.00, 42.0, 4.9, 0, 0.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', DATE_TRUNC('week', CURRENT_DATE)::DATE, 95, 5700.00, 38.0, 4.7, 0, 0.00),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', DATE_TRUNC('week', CURRENT_DATE)::DATE, 68, 4080.00, 28.0, 4.2, 0, 0.00),
  (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', DATE_TRUNC('week', CURRENT_DATE)::DATE, 52, 2600.00, 22.0, 4.6, 0, 0.00);

-- Last week stats (for comparison)
INSERT INTO worker_weekly_stats (id, worker_id, week_start_date, total_deliveries, total_earnings, active_hours, avg_rating, total_claims, total_claim_amount)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::DATE, 92, 4600.00, 35.0, 4.7, 0, 0.00),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::DATE, 38, 1900.00, 15.0, 4.6, 0, 0.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days')::DATE, 88, 5280.00, 36.0, 4.8, 0, 0.00);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Essential worker seed data loaded!' as status;

SELECT
  w.name,
  w.phone,
  w.platform,
  w.city,
  dz.name as zone_name,
  s.plan_tier,
  s.status as sub_status,
  wv.vehicle_type,
  ws.total_deliveries,
  ws.total_earnings
FROM workers w
LEFT JOIN delivery_zones dz ON w.assigned_zone_id = dz.id
LEFT JOIN insurance_subscriptions s ON w.id = s.worker_id AND s.status = 'active'
LEFT JOIN worker_vehicles wv ON w.id = wv.worker_id AND wv.is_primary = true
LEFT JOIN worker_weekly_stats ws ON w.id = ws.worker_id AND ws.week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE
ORDER BY w.name;
