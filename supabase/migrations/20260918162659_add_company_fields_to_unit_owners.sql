/*
# Add company fields to unit_owners

## Overview
Adds company-specific fields for company-type owners: company number,
registered office address, correspondence address, and support for
multiple telephone numbers and email addresses via arrays.

## Modified Tables
- `unit_owners`
  - `company_number` (text, nullable) — Companies House number
  - `registered_office_address` (text, nullable) — official registered address
  - `correspondence_address` (text, nullable) — address for correspondence
  - `telephones` (text[], nullable) — multiple telephone numbers
  - `emails` (text[], nullable) — multiple email addresses

## Notes
- For person-type owners, the existing single `telephone` and `email` columns remain in use.
- For company-type owners, the new `telephones` and `emails` array columns are used instead.
- No data is lost — all new columns are additive and nullable.
*/

ALTER TABLE unit_owners
  ADD COLUMN IF NOT EXISTS company_number text,
  ADD COLUMN IF NOT EXISTS registered_office_address text,
  ADD COLUMN IF NOT EXISTS correspondence_address text,
  ADD COLUMN IF NOT EXISTS telephones text[],
  ADD COLUMN IF NOT EXISTS emails text[];
