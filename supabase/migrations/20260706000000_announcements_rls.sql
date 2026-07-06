-- ============================================================
-- MIGRATION: 20260706000000_announcements_rls.sql
-- Allow authenticated users / managers to create and view announcements
-- ============================================================

DROP POLICY IF EXISTS announcements_select ON announcements;
DROP POLICY IF EXISTS announcements_modify ON announcements;
DROP POLICY IF EXISTS announcements_insert ON announcements;

-- Allow reading announcements if unexpired or targeted
CREATE POLICY announcements_select ON announcements
  FOR SELECT TO authenticated, anon USING (
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Allow creating announcements for authenticated users and managers
CREATE POLICY announcements_insert ON announcements
  FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Allow updating announcements (e.g. read_by)
CREATE POLICY announcements_update ON announcements
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
