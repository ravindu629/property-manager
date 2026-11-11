/*
# Add title document fields to units

## Changes
1. Adds `title_reference` — text field extracted from the Title Register document
2. Adds `title_register_path` — Supabase Storage path for the uploaded Title Register document
3. Adds `title_plan_path` — Supabase Storage path for the uploaded Title Plan document
4. Adds `lease_path` — Supabase Storage path for the uploaded Lease document

## Storage
Creates a storage bucket `unit-documents` for uploading title documents.

## Security
- No policy changes to units table. Existing RLS covers new columns.
- Storage bucket is public-read for simplicity (single-tenant app).
*/

ALTER TABLE units ADD COLUMN IF NOT EXISTS title_reference text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS title_register_path text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS title_plan_path text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS lease_path text;

-- Create storage bucket for unit documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-documents', 'unit-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read and authenticated write
CREATE POLICY "public_read_unit_docs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'unit-documents');

CREATE POLICY "anon_write_unit_docs" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'unit-documents');

CREATE POLICY "anon_update_unit_docs" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'unit-documents')
  WITH CHECK (bucket_id = 'unit-documents');

CREATE POLICY "anon_delete_unit_docs" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'unit-documents');
