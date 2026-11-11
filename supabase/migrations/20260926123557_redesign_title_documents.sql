/*
# Title Documents Redesign

## Overview
Adds lease_term_years to units for storing the lease term (e.g. 125 years).
Adds unit_id and doc_type to documents so legal documents can be linked
to specific units and categorized by document type (Title Register,
Title Plan, Lease, Deed of Variation, etc.).

## Changes
- units: + lease_term_years int
- documents: + unit_id uuid FK -> units(id) ON DELETE CASCADE
- documents: + doc_type text

## Security
No policy changes needed — documents already has full CRUD for anon/authenticated.
*/

ALTER TABLE units ADD COLUMN IF NOT EXISTS lease_term_years int;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type text;

CREATE INDEX IF NOT EXISTS idx_documents_unit_id ON documents(unit_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
