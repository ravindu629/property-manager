/*
# Create budget_schedules table

1. Changes
- Creates `budget_schedules` table to store the list of schedules used on the
  budget. Each schedule has a description (e.g. "Grounds Maintenance") and a
  sort order so they can be rearranged via drag-and-drop.
2. Security
- Enables RLS and adds permissive CRUD policies (anon + authenticated) to
  match the existing site_settings approach for this no-auth setup app.
*/

CREATE TABLE IF NOT EXISTS budget_schedules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budget_schedules' AND policyname = 'budget_schedules_select'
  ) THEN
    CREATE POLICY budget_schedules_select ON budget_schedules
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budget_schedules' AND policyname = 'budget_schedules_insert'
  ) THEN
    CREATE POLICY budget_schedules_insert ON budget_schedules
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budget_schedules' AND policyname = 'budget_schedules_update'
  ) THEN
    CREATE POLICY budget_schedules_update ON budget_schedules
      FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budget_schedules' AND policyname = 'budget_schedules_delete'
  ) THEN
    CREATE POLICY budget_schedules_delete ON budget_schedules
      FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;
