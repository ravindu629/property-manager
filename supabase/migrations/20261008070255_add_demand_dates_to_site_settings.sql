/*
# Add demand date fields to site_settings

1. Changes
- Adds four nullable date columns to `site_settings`:
  - `demand_date_1` — date for the first demand of the year
  - `demand_date_2` — date for the second demand (used when frequency >= 2)
  - `demand_date_3` — date for the third demand (used when frequency = 4)
  - `demand_date_4` — date for the fourth demand (used when frequency = 4)
  These store the day/month each demand should be dated, e.g. 1 January,
  1 April, 1 July, 1 October for a quarterly frequency of 4.
2. Security
- No policy changes. Inherits existing permissive RLS on site_settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_date_1'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_date_1 date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_date_2'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_date_2 date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_date_3'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_date_3 date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'demand_date_4'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN demand_date_4 date;
  END IF;
END $$;
