/*
# Add assignment type to units

1. Modified Tables
- `units`
  - Adds `assignment_type` column (text, nullable) to indicate whether a unit is assigned to a named building or is standalone.
  - Valid values: 'building' or 'standalone'.
2. Security
- No new RLS changes — existing policies on `units` already cover the new column.
3. Notes
- Existing rows will have NULL assignment_type, which is fine — the frontend treats NULL the same as 'standalone'.
*/

ALTER TABLE units ADD COLUMN IF NOT EXISTS assignment_type text;
