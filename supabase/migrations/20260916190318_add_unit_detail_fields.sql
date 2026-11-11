/*
# Add detailed address and unit name columns to units

## Changes
1. Adds `unit_name` — display name e.g. "Flat 1"
2. Adds structured address fields:
   - `site_name` (optional)
   - `building_name` (optional)
   - `address_line_1` (required)
   - `address_line_2` (optional)
   - `place` (required)
   - `area` (optional)
   - `county` (required)
   - `postcode` (required)
3. Migrates existing `address` data into `address_line_1` where possible.
4. Sets `unit_name` from `unit_ref` for existing rows.

## Security
- No policy changes. Existing RLS covers new columns.
*/

ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_name text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS site_name text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS building_name text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS address_line_1 text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS address_line_2 text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS place text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS county text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS postcode text;

-- Populate unit_name from unit_ref
UPDATE units SET unit_name = unit_ref WHERE unit_name IS NULL;

-- Populate address_line_1 from the old address field
UPDATE units SET address_line_1 = address WHERE address_line_1 IS NULL AND address IS NOT NULL;
UPDATE units SET place = 'London', county = 'Greater London' WHERE place IS NULL;
