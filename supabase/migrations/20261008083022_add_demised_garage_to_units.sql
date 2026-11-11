/*
# Add Demised Garage fields to units

1. Changes
- Add `demised_garage` (boolean, default false) to `units` — whether a garage is demised to the unit.
- Add `garage_number` (integer, nullable) to `units` — the garage number (1–80) if demised.
2. Security
- No RLS changes; existing policies on `units` remain unchanged.
*/

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS demised_garage boolean NOT NULL DEFAULT false;

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS garage_number integer;
