/*
# Add Service Charge Year date fields to site_settings

1. Changes
- Adds `service_charge_year_start` (date, nullable) to `site_settings`.
  The calendar-selected start date for the service charge year.
- Adds `service_charge_year_end` (date, nullable) to `site_settings`.
  The end date for the service charge year — auto-populated from the
  start date (start + 364 days) but user-editable.
2. Security
- No policy changes. The columns inherit existing permissive RLS on
  site_settings (single-tenant, TO anon, authenticated).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'service_charge_year_start'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN service_charge_year_start date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'service_charge_year_end'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN service_charge_year_end date;
  END IF;
END $$;
