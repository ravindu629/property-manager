/*
# Create unit_owners table

## Overview
A unit can have multiple owners. This table stores each owner's name and
contact details, linked to a unit via foreign key.

## New Tables
- `unit_owners`
  - `id` (uuid, primary key)
  - `unit_id` (uuid, FK to units.id, ON DELETE CASCADE)
  - `first_name` (text, not null)
  - `last_name` (text, not null)
  - `telephone` (text, nullable)
  - `email` (text, nullable)
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `unit_owners`.
- Single-tenant app (no sign-in): all policies `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` — data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS unit_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  telephone text,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unit_owners_unit_id ON unit_owners(unit_id);

ALTER TABLE unit_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_unit_owners" ON unit_owners;
CREATE POLICY "anon_select_unit_owners" ON unit_owners
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_unit_owners" ON unit_owners;
CREATE POLICY "anon_insert_unit_owners" ON unit_owners
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_unit_owners" ON unit_owners;
CREATE POLICY "anon_update_unit_owners" ON unit_owners
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_unit_owners" ON unit_owners;
CREATE POLICY "anon_delete_unit_owners" ON unit_owners
  FOR DELETE TO anon, authenticated USING (true);
