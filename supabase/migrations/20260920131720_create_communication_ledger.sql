/*
# Communication Ledger

## Overview
Creates a table to audit communications sent to unit owners.
Each row records a communication event: the mode (email, letter, text),
the document/template name, the content body, who sent it, and when.

## New Tables
- `communication_ledger`
  - `id` uuid PK
  - `unit_id` uuid FK -> units(id) ON DELETE CASCADE
  - `mode` text — 'email', 'letter', or 'text'
  - `document_name` text — name of the template used or a custom name
  - `content` text — the full body of what was sent
  - `sent_by` text — the user who sent it
  - `sent_at` timestamptz — when it was sent
  - `created_at` timestamptz

## Security
RLS enabled, full CRUD for anon + authenticated (no-auth app pattern).
*/

CREATE TABLE IF NOT EXISTS communication_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('email', 'letter', 'text')),
  document_name text NOT NULL,
  content text NOT NULL DEFAULT '',
  sent_by text NOT NULL DEFAULT 'Property Manager',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE communication_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_communication_ledger" ON communication_ledger;
CREATE POLICY "anon_select_communication_ledger" ON communication_ledger FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_communication_ledger" ON communication_ledger;
CREATE POLICY "anon_insert_communication_ledger" ON communication_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_communication_ledger" ON communication_ledger;
CREATE POLICY "anon_update_communication_ledger" ON communication_ledger FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_communication_ledger" ON communication_ledger;
CREATE POLICY "anon_delete_communication_ledger" ON communication_ledger FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_communication_ledger_unit_id ON communication_ledger(unit_id);
CREATE INDEX IF NOT EXISTS idx_communication_ledger_sent_at ON communication_ledger(sent_at DESC);
