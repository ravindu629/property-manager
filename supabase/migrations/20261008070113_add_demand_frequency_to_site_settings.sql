/*
# Add demand frequency to site_settings

1. Changes
- Adds `demand_frequency` (integer, nullable) to `site_settings`.
  Stores how many times per year service charge demands are issued.
  Allowed values: 1, 2, or 4 (annual, semi-annual, quarterly).
2. Security
- No policy changes. Inherits existing permissive RLS on site_settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_frequency'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_frequency integer;
  END IF;
END $$;
