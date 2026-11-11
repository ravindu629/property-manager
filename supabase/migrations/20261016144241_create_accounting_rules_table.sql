/*
# Create accounting_rules table

1. New Tables
- `accounting_rules`
  - `id` (uuid, primary key)
  - `account_id` (uuid, NOT NULL, references chart_of_accounts(id) ON DELETE CASCADE) — the chart of accounts line this rule applies to
  - `fund_id` (uuid, references funds(id) ON DELETE SET NULL) — the virtual fund that income/expenditure for this account posts to (nullable = posts to bank account directly)
  - `bank_account_id` (uuid, references bank_accounts(id) ON DELETE SET NULL) — the bank account to post to when no fund is specified
  - `treatment` (text, NOT NULL, default 'credit') — how the amount is posted: 'credit' (income) or 'debit' (expenditure)
  - `is_active` (boolean, NOT NULL, default true)
  - `notes` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - UNIQUE constraint on (account_id) — one rule per chart of accounts line

2. Security
- Enable RLS on `accounting_rules`.
- Allow anon + authenticated CRUD (single-tenant, no auth screen).
*/

CREATE TABLE IF NOT EXISTS accounting_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  fund_id uuid REFERENCES funds(id) ON DELETE SET NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  treatment text NOT NULL DEFAULT 'credit',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE accounting_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounting_rules" ON accounting_rules;
CREATE POLICY "anon_select_accounting_rules" ON accounting_rules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounting_rules" ON accounting_rules;
CREATE POLICY "anon_insert_accounting_rules" ON accounting_rules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounting_rules" ON accounting_rules;
CREATE POLICY "anon_update_accounting_rules" ON accounting_rules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounting_rules" ON accounting_rules;
CREATE POLICY "anon_delete_accounting_rules" ON accounting_rules FOR DELETE
  TO anon, authenticated USING (true);
