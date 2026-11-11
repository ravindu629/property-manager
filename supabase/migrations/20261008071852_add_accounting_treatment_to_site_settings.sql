/*
# Add accounting treatment to site_settings

1. Changes
- Adds `accounting_treatment` (text, nullable) to `site_settings`.
  Stores how end-of-year surpluses/deficits are handled.
  Current option: 'balancing' — surplus credited back or deficit charged
  to each unit owner based on their per-schedule contribution percentage.
2. Security
- No policy changes. Inherits existing permissive RLS on site_settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'accounting_treatment'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN accounting_treatment text;
  END IF;
END $$;
