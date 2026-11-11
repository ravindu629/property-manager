/*
# Add tenure and use columns to units table

## Changes
1. Adds `tenure` column to `units` — describes the ownership tenure type (e.g. 'leasehold', 'freehold', 'share_of_freehold'). Defaults to 'leasehold'.
2. Adds `use` column to `units` — describes the permitted use of the unit (e.g. 'residential', 'retail', 'office', 'mixed'). Defaults to 'residential'.
3. Updates existing residential units to tenure='leasehold', use='residential'.
4. Updates the commercial unit to tenure='leasehold', use='retail'.

## Security
- No policy changes. Existing RLS policies cover the new columns automatically.
*/

ALTER TABLE units ADD COLUMN IF NOT EXISTS tenure text NOT NULL DEFAULT 'leasehold';
ALTER TABLE units ADD COLUMN IF NOT EXISTS use text NOT NULL DEFAULT 'residential';

UPDATE units SET tenure = 'leasehold', use = 'residential' WHERE type = 'residential';
UPDATE units SET tenure = 'leasehold', use = 'retail' WHERE type = 'commercial';
