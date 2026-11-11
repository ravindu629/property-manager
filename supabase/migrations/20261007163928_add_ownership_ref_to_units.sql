/*
# Add ownership reference to units

1. Changes
- Adds `ownership_ref` (text, nullable) column to `units`.
  Stores an auto-generated reference for the ownership record of a unit,
  shown behind a reveal toggle in the Ownership section of the Unit detail view.
2. Security
- No policy changes needed. The column inherits the existing permissive
  RLS policies already on `units` (single-tenant, TO anon, authenticated).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'ownership_ref'
  ) THEN
    ALTER TABLE units ADD COLUMN ownership_ref text;
  END IF;
END $$;
