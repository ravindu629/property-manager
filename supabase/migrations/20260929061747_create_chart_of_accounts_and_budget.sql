/*
# Chart of Accounts and Budget Templates

## Overview
Creates the Chart of Accounts table seeded with UK property management cost categories,
plus Budget Templates and Budget Lines tables for the Finance > Budget tab.
Users can create budget templates by selecting cost categories from the chart of accounts,
entering budgeted amounts per category, and saving the template.

## New Tables

### chart_of_accounts
- id (uuid PK)
- code (text, unique) — account code e.g. "100", "210"
- name (text) — category name e.g. "Repairs & Maintenance"
- type (text) — "income" or "expenditure"
- group (text) — grouping e.g. "Income", "Operating Costs", "Admin", "Reserve"
- is_active (boolean, default true)
- sort_order (int, default 0)
- created_at (timestamptz)

### budget_templates
- id (uuid PK)
- name (text) — template name e.g. "2025 Annual Budget"
- financial_year (text) — e.g. "2025/26"
- status (text, default "draft") — "draft" or "approved"
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### budget_lines
- id (uuid PK)
- budget_template_id (uuid FK -> budget_templates ON DELETE CASCADE)
- account_id (uuid FK -> chart_of_accounts ON DELETE RESTRICT)
- amount (numeric, default 0)
- notes (text, nullable)
- sort_order (int, default 0)
- created_at (timestamptz)

## Security
- RLS enabled on all three tables.
- Policies: anon + authenticated full CRUD (single-tenant app, no sign-in).
*/

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expenditure',
  "group" text NOT NULL DEFAULT 'Operating Costs',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_coa" ON chart_of_accounts;
CREATE POLICY "anon_select_coa" ON chart_of_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_coa" ON chart_of_accounts;
CREATE POLICY "anon_insert_coa" ON chart_of_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_coa" ON chart_of_accounts;
CREATE POLICY "anon_update_coa" ON chart_of_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_coa" ON chart_of_accounts;
CREATE POLICY "anon_delete_coa" ON chart_of_accounts FOR DELETE
  TO anon, authenticated USING (true);

-- Budget Templates
CREATE TABLE IF NOT EXISTS budget_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  financial_year text,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_budget_templates" ON budget_templates;
CREATE POLICY "anon_select_budget_templates" ON budget_templates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budget_templates" ON budget_templates;
CREATE POLICY "anon_insert_budget_templates" ON budget_templates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budget_templates" ON budget_templates;
CREATE POLICY "anon_update_budget_templates" ON budget_templates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budget_templates" ON budget_templates;
CREATE POLICY "anon_delete_budget_templates" ON budget_templates FOR DELETE
  TO anon, authenticated USING (true);

-- Budget Lines
CREATE TABLE IF NOT EXISTS budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_template_id uuid NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_budget_lines" ON budget_lines;
CREATE POLICY "anon_select_budget_lines" ON budget_lines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budget_lines" ON budget_lines;
CREATE POLICY "anon_insert_budget_lines" ON budget_lines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budget_lines" ON budget_lines;
CREATE POLICY "anon_update_budget_lines" ON budget_lines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budget_lines" ON budget_lines;
CREATE POLICY "anon_delete_budget_lines" ON budget_lines FOR DELETE
  TO anon, authenticated USING (true);

-- Seed chart of accounts with UK property management categories
INSERT INTO chart_of_accounts (code, name, type, "group", sort_order) VALUES
-- Income
('100', 'Ground Rent Income', 'income', 'Income', 1),
('110', 'Service Charge Income', 'income', 'Income', 2),
('120', 'Reserve Fund Contributions', 'income', 'Income', 3),
('130', 'Sinking Fund Contributions', 'income', 'Income', 4),
('140', 'Insurance Recoveries', 'income', 'Income', 5),
('150', 'Interest Received', 'income', 'Income', 6),
('160', 'Other Income', 'income', 'Income', 7),
-- Operating Costs
('200', 'Repairs & Maintenance', 'expenditure', 'Operating Costs', 10),
('210', 'Cleaning', 'expenditure', 'Operating Costs', 11),
('220', 'Security & Concierge', 'expenditure', 'Operating Costs', 12),
('230', 'Utilities - Electricity', 'expenditure', 'Operating Costs', 13),
('240', 'Utilities - Gas', 'expenditure', 'Operating Costs', 14),
('250', 'Utilities - Water', 'expenditure', 'Operating Costs', 15),
('260', 'Lift Maintenance', 'expenditure', 'Operating Costs', 16),
('270', 'Fire Safety & Alarm Systems', 'expenditure', 'Operating Costs', 17),
('280', 'Gardening & Grounds Maintenance', 'expenditure', 'Operating Costs', 18),
('290', 'Pest Control', 'expenditure', 'Operating Costs', 19),
('300', 'Waste Collection', 'expenditure', 'Operating Costs', 20),
('310', 'Window Cleaning', 'expenditure', 'Operating Costs', 21),
('320', 'Communal Area Maintenance', 'expenditure', 'Operating Costs', 22),
-- Insurance
('400', 'Buildings Insurance', 'expenditure', 'Insurance', 30),
('410', 'Directors & Officers Insurance', 'expenditure', 'Insurance', 31),
('420', 'Engineering Insurance', 'expenditure', 'Insurance', 32),
('430', 'Public Liability Insurance', 'expenditure', 'Insurance', 33),
-- Professional Fees
('500', 'Managing Agent Fees', 'expenditure', 'Professional Fees', 40),
('510', 'Legal Fees', 'expenditure', 'Professional Fees', 41),
('520', 'Accountancy & Audit Fees', 'expenditure', 'Professional Fees', 42),
('530', 'Surveyor Fees', 'expenditure', 'Professional Fees', 43),
('540', 'Consultancy Fees', 'expenditure', 'Professional Fees', 44),
('550', 'Valuation Fees', 'expenditure', 'Professional Fees', 45),
-- Admin & Compliance
('600', 'Companies House Filing', 'expenditure', 'Admin & Compliance', 50),
('610', 'Data Protection (ICO) Fees', 'expenditure', 'Admin & Compliance', 51),
('620', 'Bank Charges', 'expenditure', 'Admin & Compliance', 52),
('630', 'Stationery & Postage', 'expenditure', 'Admin & Compliance', 53),
('640', 'Telecommunications', 'expenditure', 'Admin & Compliance', 54),
('650', 'Software & IT Services', 'expenditure', 'Admin & Compliance', 55),
('660', 'Staff Costs', 'expenditure', 'Admin & Compliance', 56),
('670', 'Health & Safety Compliance', 'expenditure', 'Admin & Compliance', 57),
-- Reserve & Sinking Fund
('700', 'Reserve Fund Deposit', 'expenditure', 'Reserve & Sinking Fund', 60),
('710', 'Sinking Fund Deposit', 'expenditure', 'Reserve & Sinking Fund', 61),
('720', 'Major Works Reserve', 'expenditure', 'Reserve & Sinking Fund', 62),
-- Section 20 Costs
('800', 'Section 20 Consultation Costs', 'expenditure', 'Section 20', 70),
('810', 'Major Works Project Costs', 'expenditure', 'Section 20', 71),
('820', 'Project Management Fees', 'expenditure', 'Section 20', 72),
-- Other
('900', 'Bad Debts', 'expenditure', 'Other', 80),
('910', 'Irrecoverable Service Charges', 'expenditure', 'Other', 81),
('920', 'Contingency', 'expenditure', 'Other', 82),
('930', 'Depreciation', 'expenditure', 'Other', 83)
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_budget_lines_template ON budget_lines(budget_template_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON budget_lines(account_id);
