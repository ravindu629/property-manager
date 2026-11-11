/*
# Create funds table for virtual fund balances

1. New Tables
- `funds`
- `id` (uuid, primary key)
- `name` (text, not null) — e.g. "Reserve Fund", "Service Charge Fund"
- `building_name` (text, nullable) — the building this fund belongs to (e.g. "Kingfisher Court"). NULL means site-wide.
- `fund_type` (text, not null) — one of: 'service_charge', 'reserve', 'sinking', 'client', 'other'
- `opening_balance` (numeric, default 0) — balance at fund creation
- `current_balance` (numeric, default 0) — live virtual balance, updated as income/expenditure is allocated
- `is_active` (boolean, default true)
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

2. Security
- RLS enabled on `funds`.
- Anon + authenticated CRUD (single-tenant, no-auth app — data is intentionally shared).
*/ 

CREATE TABLE IF NOT EXISTS funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building_name text,
  fund_type text NOT NULL DEFAULT 'service_charge',
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  current_balance numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_funds" ON funds;
CREATE POLICY "anon_select_funds" ON funds FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_funds" ON funds;
CREATE POLICY "anon_insert_funds" ON funds FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_funds" ON funds;
CREATE POLICY "anon_update_funds" ON funds FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_funds" ON funds;
CREATE POLICY "anon_delete_funds" ON funds FOR DELETE
  TO anon, authenticated USING (true);
