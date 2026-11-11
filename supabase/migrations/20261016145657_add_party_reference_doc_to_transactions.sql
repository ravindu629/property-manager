/*
# Add party, reference, and doc fields to transactions

1. Modified Tables
- `transactions`
  - `party` (text, nullable) — the counterparty for the transaction (e.g. supplier name, unit owner, bank)
  - `reference` (text, nullable) — an invoice number, receipt number, or other reference code
  - `doc_url` (text, nullable) — URL to a supporting document (invoice, receipt, statement)

2. Security
- No RLS changes — existing policies remain in place.
*/

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS party text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS doc_url text;
