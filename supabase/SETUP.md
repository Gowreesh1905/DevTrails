# Supabase Database Setup Guide

This guide walks you through setting up the SwiftShield database on Supabase.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `swiftshield` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `Mumbai ap-south-1` for India)
4. Click "Create new project" and wait for setup (~2 minutes)

## Step 2: Enable PostGIS Extension

1. Go to **Database** → **Extensions** in your Supabase dashboard
2. Search for `postgis`
3. Enable the **postgis** extension (required for geospatial queries)

## Step 3: Run the Migration

### Option A: Via SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or Cmd/Ctrl + Enter)

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 4: Configure Environment Variables

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values to your `.env.local` file:

```env
# From "Project URL"
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# From "Project API keys" → "anon public"
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# From "Project API keys" → "service_role" (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 6: Verify Setup

Run this query in the SQL Editor to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see tables like: `claims`, `workers`, `insurance_subscriptions`, etc.

## Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `workers` | Delivery partners (Blinkit/Zepto/Instamart) |
| `worker_vehicles` | Vehicle information for workers |
| `worker_weekly_stats` | Aggregated weekly statistics |
| `insurance_subscriptions` | Active insurance plans |
| `claims` | Insurance claims |
| `claim_verifications` | 4-layer fraud detection results |
| `payouts` | UPI payment records |
| `wallet_transactions` | Wallet credits/debits |

### Reference Tables

| Table | Description |
|-------|-------------|
| `plan_tiers` | Plan configurations (Starter/Shield/Pro) |
| `trigger_definitions` | Trigger types (T1-T6) |
| `delivery_zones` | GPS zones with risk scores |
| `disruptions` | Weather events and disruptions |

### Analytics Tables

| Table | Description |
|-------|-------------|
| `zone_risk_history` | Historical zone risk data |
| `worker_risk_scores` | ML-based worker risk scores |
| `audit_logs` | System audit trail |

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────────┐
│     workers     │────<│ insurance_subscriptions│
└────────┬────────┘     └──────────┬───────────┘
         │                         │
         │    ┌────────────────────┘
         │    │
         ▼    ▼
┌─────────────────┐     ┌──────────────────────┐
│     claims      │────<│  claim_verifications │
└────────┬────────┘     └──────────────────────┘
         │
         ▼
┌─────────────────┐
│     payouts     │
└─────────────────┘

┌─────────────────┐     ┌──────────────────────┐
│   disruptions   │────<│   disruption_zones   │
└─────────────────┘     └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   delivery_zones     │
                        └──────────────────────┘
```

## Row Level Security (RLS)

All tables have RLS enabled. Workers can only access their own data:

- Workers can read/update their own profile
- Workers can view their own claims, payouts, subscriptions
- Everyone can read reference data (plans, triggers, zones)

### Admin Access

For admin operations, use the service role key:

```typescript
import { createAdminClient } from '@/lib/supabase';

// Bypasses RLS - use only for admin operations
const adminClient = createAdminClient();
```

## Common Queries

### Get worker with active subscription

```typescript
const { data } = await supabase
  .from('workers')
  .select(`
    *,
    subscription:insurance_subscriptions!inner(*)
  `)
  .eq('id', workerId)
  .eq('insurance_subscriptions.status', 'active')
  .single();
```

### Get claims for current week

```typescript
const weekStart = new Date();
weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

const { data } = await supabase
  .from('claims')
  .select('*')
  .eq('worker_id', workerId)
  .gte('claim_date', weekStart.toISOString().split('T')[0])
  .in('status', ['approved', 'paid']);
```

### Check active disruptions in a zone

```typescript
const { data } = await supabase
  .from('disruption_zones')
  .select(`
    disruption:disruptions(*)
  `)
  .eq('zone_id', zoneId)
  .eq('disruptions.is_active', true);
```

## Troubleshooting

### "permission denied for table"
- Check that RLS policies are applied correctly
- Verify the user is authenticated
- For admin operations, use the service role key

### PostGIS not working
- Ensure the `postgis` extension is enabled
- The `geom` column uses `GEOGRAPHY(POINT, 4326)` type

### Migrations fail
- Run the schema in sections if needed
- Check for existing tables that might conflict
- Ensure PostGIS is enabled before running the full migration

## Next Steps

1. Set up Supabase Auth for OTP login
2. Configure Realtime subscriptions for live updates
3. Set up Edge Functions for claim processing
4. Configure Storage for profile images
