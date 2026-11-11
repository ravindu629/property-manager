/*
# Property Management Schema — Leasehold Flats & Commercial Unit

## Overview
Creates a complete schema for managing a site of leasehold flats and one commercial unit.
Single-tenant app (no sign-in), all policies use `TO anon, authenticated`.

## Tables
- units: each flat and the commercial unit
- transactions: income/expenditure
- assets: physical assets (boilers, lifts, roofs, etc.)
- repairs: repair and maintenance jobs
- insurance_policies: insurance policies
- transfers: reserve fund movements
- s20_projects: Section 20 major works
- documents: library of documents
- templates: document templates
- site_settings: single-row site config

## Security
- RLS enabled on all tables.
- All policies `TO anon, authenticated` with `USING (true)` — single-tenant, no auth.
*/

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_ref text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'residential',
  address text,
  owner_name text,
  lease_start date,
  lease_expiry date,
  ground_rent_annual numeric(12,2) DEFAULT 0,
  service_charge_annual numeric(12,2) DEFAULT 0,
  floor_area_sqm numeric(8,2),
  bedrooms int,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_units" ON units;
CREATE POLICY "anon_select_units" ON units FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_units" ON units;
CREATE POLICY "anon_insert_units" ON units FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_units" ON units;
CREATE POLICY "anon_update_units" ON units FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_units" ON units;
CREATE POLICY "anon_delete_units" ON units FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'service_charge',
  type text NOT NULL DEFAULT 'income',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  category text NOT NULL DEFAULT 'building',
  installed_date date,
  expected_life_years int,
  condition text NOT NULL DEFAULT 'good',
  last_inspected date,
  next_inspection_due date,
  replacement_cost numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_assets" ON assets;
CREATE POLICY "anon_select_assets" ON assets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assets" ON assets;
CREATE POLICY "anon_insert_assets" ON assets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assets" ON assets;
CREATE POLICY "anon_update_assets" ON assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assets" ON assets;
CREATE POLICY "anon_delete_assets" ON assets FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'reported',
  contractor text,
  estimated_cost numeric(12,2) DEFAULT 0,
  actual_cost numeric(12,2) DEFAULT 0,
  reported_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_repairs" ON repairs;
CREATE POLICY "anon_select_repairs" ON repairs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_repairs" ON repairs;
CREATE POLICY "anon_insert_repairs" ON repairs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_repairs" ON repairs;
CREATE POLICY "anon_update_repairs" ON repairs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_repairs" ON repairs;
CREATE POLICY "anon_delete_repairs" ON repairs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL DEFAULT 'buildings',
  provider text,
  policy_number text,
  start_date date,
  end_date date,
  premium_annual numeric(12,2) DEFAULT 0,
  excess numeric(12,2) DEFAULT 0,
  sum_insured numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_insurance" ON insurance_policies;
CREATE POLICY "anon_select_insurance" ON insurance_policies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_insurance" ON insurance_policies;
CREATE POLICY "anon_insert_insurance" ON insurance_policies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_insurance" ON insurance_policies;
CREATE POLICY "anon_update_insurance" ON insurance_policies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_insurance" ON insurance_policies;
CREATE POLICY "anon_delete_insurance" ON insurance_policies FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account text NOT NULL,
  to_account text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transfers" ON transfers;
CREATE POLICY "anon_select_transfers" ON transfers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transfers" ON transfers;
CREATE POLICY "anon_insert_transfers" ON transfers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transfers" ON transfers;
CREATE POLICY "anon_update_transfers" ON transfers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transfers" ON transfers;
CREATE POLICY "anon_delete_transfers" ON transfers FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS s20_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'roof',
  status text NOT NULL DEFAULT 'proposed',
  estimated_cost numeric(12,2) DEFAULT 0,
  actual_cost numeric(12,2) DEFAULT 0,
  start_date date,
  end_date date,
  consultation_start date,
  consultation_end date,
  contractor text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE s20_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_s20" ON s20_projects;
CREATE POLICY "anon_select_s20" ON s20_projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_s20" ON s20_projects;
CREATE POLICY "anon_insert_s20" ON s20_projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_s20" ON s20_projects;
CREATE POLICY "anon_update_s20" ON s20_projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_s20" ON s20_projects;
CREATE POLICY "anon_delete_s20" ON s20_projects FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'minutes',
  file_url text,
  file_type text,
  date_added date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'letter',
  content text,
  last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_templates" ON templates;
CREATE POLICY "anon_select_templates" ON templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_templates" ON templates;
CREATE POLICY "anon_insert_templates" ON templates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_templates" ON templates;
CREATE POLICY "anon_update_templates" ON templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_templates" ON templates;
CREATE POLICY "anon_delete_templates" ON templates FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'Maple Court',
  site_address text,
  management_company text,
  management_agent text,
  total_units int DEFAULT 0,
  financial_year_start text DEFAULT 'April',
  reserve_fund_balance numeric(12,2) DEFAULT 0,
  sinking_fund_balance numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_site_settings" ON site_settings;
CREATE POLICY "anon_select_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_site_settings" ON site_settings;
CREATE POLICY "anon_insert_site_settings" ON site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_site_settings" ON site_settings;
CREATE POLICY "anon_update_site_settings" ON site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_site_settings" ON site_settings;
CREATE POLICY "anon_delete_site_settings" ON site_settings FOR DELETE TO anon, authenticated USING (true);

INSERT INTO site_settings (id, site_name, site_address, management_company, management_agent, total_units, financial_year_start, reserve_fund_balance, sinking_fund_balance)
VALUES (1, 'Maple Court', '12 Maple Court Road, London', 'Maple Court Management Ltd', 'Premier Property Management', 12, 'April', 45000, 120000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (unit_ref, type, address, owner_name, lease_start, lease_expiry, ground_rent_annual, service_charge_annual, floor_area_sqm, bedrooms) VALUES
('Flat 1', 'residential', '12 Maple Court Road, Flat 1', 'J. Smith', '2005-03-15', '2075-03-14', 250.00, 1850.00, 65.0, 2),
('Flat 2', 'residential', '12 Maple Court Road, Flat 2', 'A. Patel', '2005-03-15', '2075-03-14', 250.00, 2100.00, 78.0, 3),
('Flat 3', 'residential', '12 Maple Court Road, Flat 3', 'M. Brown', '2005-03-15', '2075-03-14', 250.00, 1850.00, 65.0, 2),
('Flat 4', 'residential', '12 Maple Court Road, Flat 4', 'S. O''Connor', '2005-03-15', '2075-03-14', 300.00, 2400.00, 92.0, 3),
('Flat 5', 'residential', '12 Maple Court Road, Flat 5', 'R. Khan', '2005-03-15', '2075-03-14', 250.00, 1950.00, 70.0, 2),
('Flat 6', 'residential', '12 Maple Court Road, Flat 6', 'L. Davies', '2005-03-15', '2075-03-14', 250.00, 1850.00, 65.0, 2),
('Flat 7', 'residential', '12 Maple Court Road, Flat 7', 'T. Wilson', '2005-03-15', '2075-03-14', 300.00, 2400.00, 92.0, 3),
('Flat 8', 'residential', '12 Maple Court Road, Flat 8', 'C. Murphy', '2005-03-15', '2075-03-14', 250.00, 1850.00, 65.0, 2),
('Flat 9', 'residential', '12 Maple Court Road, Flat 9', 'D. Hughes', '2005-03-15', '2075-03-14', 250.00, 2100.00, 78.0, 3),
('Flat 10', 'residential', '12 Maple Court Road, Flat 10', 'P. Thompson', '2005-03-15', '2075-03-14', 350.00, 2800.00, 105.0, 3),
('Flat 11', 'residential', '12 Maple Court Road, Flat 11', 'E. Roberts', '2005-03-15', '2075-03-14', 250.00, 1850.00, 65.0, 2),
('Commercial Unit', 'commercial', '12 Maple Court Road, Ground Floor', 'Acme Retail Ltd', '2005-03-15', '2030-03-14', 5000.00, 6500.00, 150.0, 0)
ON CONFLICT (unit_ref) DO NOTHING;

INSERT INTO assets (name, location, category, installed_date, expected_life_years, condition, last_inspected, next_inspection_due, replacement_cost) VALUES
('Main Roof', 'Entire building', 'building', '2005-03-01', 50, 'fair', '2025-01-15', '2026-01-15', 85000),
('Passenger Lift', 'Main stairwell', 'mechanical', '2005-06-01', 25, 'good', '2026-03-01', '2026-09-01', 45000),
('Communal Boiler', 'Plant room', 'mechanical', '2018-09-01', 15, 'good', '2026-01-20', '2026-07-20', 12000),
('Fire Alarm System', 'Throughout', 'electrical', '2020-02-01', 10, 'excellent', '2026-02-01', '2026-08-01', 8000),
('Entry Phone System', 'Main entrance', 'electrical', '2019-05-01', 12, 'good', '2025-11-01', '2026-05-01', 3500),
('External Cladding', 'Facade', 'external', '2005-03-01', 40, 'fair', '2025-06-01', '2026-06-01', 60000),
('Communal Lighting', 'Hallways & stairwells', 'electrical', '2021-01-01', 15, 'excellent', '2026-01-10', '2027-01-10', 2500),
('Drainage System', 'Underground', 'building', '2005-03-01', 60, 'good', '2025-09-01', '2026-09-01', 15000)
ON CONFLICT DO NOTHING;

INSERT INTO insurance_policies (policy_type, provider, policy_number, start_date, end_date, premium_annual, excess, sum_insured, status) VALUES
('buildings', 'Aviva', 'AV-BLD-2025-001', '2025-06-01', '2026-05-31', 8500.00, 500.00, 2500000.00, 'active'),
('public_liability', 'AXA', 'AX-PL-2025-774', '2025-06-01', '2026-05-31', 1200.00, 250.00, 5000000.00, 'active'),
('directors_officers', 'Hiscox', 'HX-DO-2025-332', '2025-01-01', '2025-12-31', 850.00, 1000.00, 500000.00, 'pending_renewal'),
('engineering', 'Allianz', 'AL-ENG-2025-119', '2025-03-01', '2026-02-28', 600.00, 250.00, 100000.00, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO repairs (title, description, priority, status, contractor, estimated_cost, actual_cost, reported_date, completed_date) VALUES
('Lift door not closing properly', 'Ground floor lift door sticks intermittently', 'high', 'in_progress', 'Otis Elevators', 450.00, 0, '2026-09-01', NULL),
('Leak from flat 4 bathroom', 'Water dripping through ceiling of flat 3', 'emergency', 'completed', 'DrainTech Plumbing', 0, 680.00, '2026-08-15', '2026-08-20'),
('Communal light fitting broken', 'Second floor hallway light cracked', 'low', 'reported', '', 120.00, 0, '2026-09-10', NULL),
('Fire alarm panel fault', 'Intermittent fault code on main panel', 'high', 'approved', 'FireSafe Ltd', 350.00, 0, '2026-09-05', NULL),
('External guttering blocked', 'Gutter at rear of building overflowing during rain', 'medium', 'in_progress', 'GutterClear', 280.00, 0, '2026-08-28', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO s20_projects (title, description, category, status, estimated_cost, actual_cost, consultation_start, consultation_end, contractor) VALUES
('Roof Replacement Programme', 'Full replacement of main roof covering and insulation', 'roof', 'consultation', 95000.00, 0, '2026-09-01', '2026-11-30', '')
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, category, file_url, file_type, date_added, description, tags) VALUES
('AGM Minutes 2026', 'minutes', '', 'pdf', '2026-06-15', 'Annual General Meeting minutes from June 2026', '{"agm","minutes","2026"}'),
('AGM Minutes 2025', 'minutes', '', 'pdf', '2025-06-20', 'Annual General Meeting minutes from June 2025', '{"agm","minutes","2025"}'),
('Accounts 2025-2026', 'accounts', '', 'pdf', '2026-05-01', 'Annual accounts for financial year 2025-2026', '{"accounts","finance"}'),
('Lease Template', 'legal', '', 'pdf', '2005-03-15', 'Standard lease template for the development', '{"lease","legal"}'),
('Service Charge Budget 2026', 'accounts', '', 'xlsx', '2026-01-01', 'Service charge budget and forecast for 2026', '{"budget","finance","2026"}')
ON CONFLICT DO NOTHING;

INSERT INTO templates (name, category, content, last_updated) VALUES
('Demand Letter - Ground Rent', 'letter', 'Dear [Owner Name],

This is a formal demand for ground rent of [Amount] due on [Date] for [Unit Ref].

Please remit payment within 14 days.

Regards,
[Management Agent]', '2026-01-15'),
('Section 20 Notice - Stage 1', 'notice', 'Notice under Section 20 of the Landlord and Leasehold Reform Act 1993

[Project Title]

[Description]

Consultation period: [Start Date] to [End Date]', '2026-01-20'),
('Annual Service Charge Demand', 'invoice', 'Service Charge Demand - Financial Year [Year]

Unit: [Unit Ref]
Owner: [Owner Name]
Amount Due: [Amount]

Due by: [Due Date]', '2026-01-10'),
('AGM Notice', 'letter', 'Notice of Annual General Meeting

Date: [Date]
Time: [Time]
Venue: [Venue]

Agenda:
1. Apologies
2. Minutes of previous AGM
3. Accounts
4. Budget
5. Election of directors
6. Any other business', '2026-01-05'),
('Repair Acknowledgement Email', 'email', 'Dear [Owner Name],

We acknowledge receipt of your repair request: [Repair Title].

A contractor will be assigned and we will update you on progress.

Reference: [Repair Ref]', '2026-02-01')
ON CONFLICT DO NOTHING;

INSERT INTO transactions (unit_id, category, type, amount, transaction_date, description, status)
SELECT u.id, 'service_charge', 'income', u.service_charge_annual, '2026-04-01'::date, 'Annual service charge - FY 2026/27', 'cleared' FROM units u WHERE u.unit_ref = 'Flat 1'
UNION ALL
SELECT u.id, 'ground_rent', 'income', u.ground_rent_annual, '2026-04-01'::date, 'Ground rent - FY 2026/27', 'cleared' FROM units u WHERE u.unit_ref = 'Flat 1'
UNION ALL
SELECT u.id, 'service_charge', 'income', u.service_charge_annual, '2026-04-01'::date, 'Annual service charge - FY 2026/27', 'pending' FROM units u WHERE u.unit_ref = 'Flat 4'
UNION ALL
SELECT NULL, 'maintenance', 'expenditure', 680.00, '2026-08-20'::date, 'Plumbing repair - flat 4 bathroom leak', 'cleared'
UNION ALL
SELECT NULL, 'insurance', 'expenditure', 8500.00, '2026-06-01'::date, 'Buildings insurance premium - Aviva', 'cleared'
ON CONFLICT DO NOTHING;

INSERT INTO transfers (from_account, to_account, amount, transfer_date, reference, status, notes) VALUES
('Service Charge Account', 'Reserve Fund', 5000.00, '2026-04-15', 'Q1 reserve allocation', 'completed', 'Quarterly transfer to reserve fund')
ON CONFLICT DO NOTHING;
