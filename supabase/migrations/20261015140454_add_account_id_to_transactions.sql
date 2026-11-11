ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES chart_of_accounts(id) ON DELETE SET NULL;