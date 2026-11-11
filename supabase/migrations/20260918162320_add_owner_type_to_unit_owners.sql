/*
# Add owner_type column to unit_owners

## Overview
Adds an `owner_type` column to distinguish between individual persons and
companies. For companies, `first_name` stores the company name and
`last_name` is left empty.

## Modified Tables
- `unit_owners`
  - `owner_type` (text, NOT NULL, DEFAULT 'person') — 'person' or 'company'

## Security
- No policy changes. Existing RLS policies remain in place.
*/

ALTER TABLE unit_owners
  ADD COLUMN IF NOT EXISTS owner_type text NOT NULL DEFAULT 'person';
