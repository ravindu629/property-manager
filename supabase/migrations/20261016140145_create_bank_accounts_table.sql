/*
# Create bank_accounts table and link funds to bank accounts

1. New Tables
- `bank_accounts`
- `id` (uuid, primary key)
- `bank_name` (text, not null) — e.g. "Barclays", "Lloyds"
- `account_name` (text, not null) — e.g. "Kingfisher Court Client Account"
- `account_number` (text, not null) — the bank account number
- `sort_code` (text, not null) — UK sort code
- `is_active` (boolean, default true)
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

2. Modified Tables
- `funds`: add `bank_account_id` (uuid, nullable, references bank_accounts(id) ON DELETE SET NULL)
  This links each virtual fund to its parent bank account.

3. Security
- RLS enabled on `bank_accounts`.
- Anon + authenticated CRUD (single-tenant, no-auth app — data is intentionally shared).
*/

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  sort_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_select_bank_accounts" ON bank_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_insert_bank_accounts" ON bank_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_update_bank_accounts" ON bank_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_delete_bank_accounts" ON bank_accounts FOR DELETE
  TO anon, authenticated USING (true);

ALTER TABLE funds
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL;
