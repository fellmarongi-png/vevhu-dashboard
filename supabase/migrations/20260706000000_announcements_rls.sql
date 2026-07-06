-- ============================================================
-- MIGRATION: 20260706000000_announcements_rls.sql
-- 1. Update announcements & users RLS policies
-- 2. Add verify_worker_login and register_admin_worker RPC functions
-- ============================================================

-- ANNOUNCEMENTS RLS
DROP POLICY IF EXISTS announcements_select ON announcements;
DROP POLICY IF EXISTS announcements_modify ON announcements;
DROP POLICY IF EXISTS announcements_insert ON announcements;
DROP POLICY IF EXISTS announcements_update ON announcements;
DROP POLICY IF EXISTS announcements_delete ON announcements;

CREATE POLICY announcements_select ON announcements
  FOR SELECT TO authenticated, anon USING (
    (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY announcements_insert ON announcements
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY announcements_update ON announcements
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY announcements_delete ON announcements
  FOR DELETE TO authenticated, anon USING (true);


-- USERS RLS FOR WORKER AUTHENTICATION
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_modify ON users;
DROP POLICY IF EXISTS users_select_all ON users;
DROP POLICY IF EXISTS users_insert_all ON users;

CREATE POLICY users_select_all ON users
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY users_insert_all ON users
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY users_update_all ON users
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);


-- RPC: verify_worker_login
CREATE OR REPLACE FUNCTION verify_worker_login(
  worker_name text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  role text,
  phone text,
  zone_assigned text,
  daily_target integer,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.role::text, u.phone, u.zone_assigned, u.daily_target, u.is_active
  FROM users u
  WHERE LOWER(u.full_name) = LOWER(TRIM(worker_name))
    AND u.role = 'worker'
    AND u.is_active = true;
END;
$$;


-- RPC: register_admin_worker
CREATE OR REPLACE FUNCTION register_admin_worker(
  w_name text,
  w_phone text DEFAULT '+263 77 000 0000',
  w_zone text DEFAULT 'Harare North',
  w_target integer DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_worker_id uuid;
BEGIN
  INSERT INTO users (id, full_name, phone, zone_assigned, daily_target, role, is_active)
  VALUES (gen_random_uuid(), w_name, w_phone, w_zone, w_target, 'worker', true)
  RETURNING id INTO new_worker_id;

  RETURN new_worker_id;
END;
$$;
