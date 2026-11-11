/*
# Create unit_schedule_apportionments table

1. Changes
- Creates `unit_schedule_apportionments` table to store the contribution
  percentage or share each unit makes toward each budget schedule.
  - unit_id references units
  - schedule_id references budget_schedules
  - contribution is a numeric value (percentage or share)
  - Unique constraint on (unit_id, schedule_id) prevents duplicates.
2. Security
- Enables RLS and adds permissive CRUD policies (anon + authenticated)
  to match the existing approach for this no-auth setup app.
*/

CREATE TABLE IF NOT EXISTS unit_schedule_apportionments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  unit_id text NOT NULL REFERENCES units(unit_ref) ON DELETE CASCADE,
  schedule_id bigint NOT NULL REFERENCES budget_schedules(id) ON DELETE CASCADE,
  contribution numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, schedule_id)
);

ALTER TABLE unit_schedule_apportionments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unit_schedule_apportionments' AND policyname = 'unit_schedule_apportionments_select'
  ) THEN
    CREATE POLICY unit_schedule_apportionments_select ON unit_schedule_apportionments
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unit_schedule_apportionments' AND policyname = 'unit_schedule_apportionments_insert'
  ) THEN
    CREATE POLICY unit_schedule_apportionments_insert ON unit_schedule_apportionments
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unit_schedule_apportionments' AND policyname = 'unit_schedule_apportionments_update'
  ) THEN
    CREATE POLICY unit_schedule_apportionments_update ON unit_schedule_apportionments
      FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unit_schedule_apportionments' AND policyname = 'unit_schedule_apportionments_delete'
  ) THEN
    CREATE POLICY unit_schedule_apportionments_delete ON unit_schedule_apportionments
      FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;
