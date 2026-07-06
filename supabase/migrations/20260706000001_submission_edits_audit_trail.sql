-- ============================================================
-- MIGRATION: 20260706000001_submission_edits_audit_trail.sql
-- Add submission_edits table for worker edits audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS submission_edits (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id        UUID         NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  edited_by_worker_id  UUID         NOT NULL,
  edited_by_worker_name TEXT        NOT NULL,
  edited_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  previous_data        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  updated_data         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  edit_reason          TEXT
);

-- RLS Policies for submission_edits
ALTER TABLE submission_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submission_edits_select ON submission_edits;
DROP POLICY IF EXISTS submission_edits_insert ON submission_edits;

CREATE POLICY submission_edits_select ON submission_edits
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY submission_edits_insert ON submission_edits
  FOR INSERT TO authenticated, anon WITH CHECK (true);
