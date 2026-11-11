/*
# Add scope and unit_id to funds

1. Modified Tables
- `funds`: add `scope` (text, default 'site') — one of 'site', 'building', 'unit'
- `funds`: add `unit_id` (uuid, nullable, references units(id) ON DELETE SET NULL)
  Used when scope is 'unit'. Links a fund to a specific unit.

2. Notes
- building_name is reused for the 'building' scope.
- No security changes needed — funds already has full anon/authenticated CRUD policies.
*/

ALTER TABLE funds
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'site';

ALTER TABLE funds
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE SET NULL;
