/*
# Add demand treatment to site_settings

1. Changes
- Adds `demand_treatment` (text, nullable) to `site_settings`.
  Stores whether demands are issued 'in_advance' (based on budgeted
  expenditure) or 'in_arrears' (based on actual expenditure after the fact).
2. Security
- No policy changes. Inherits existing permissive RLS on site_settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_treatment'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_treatment text;
  END IF;
END $$;
