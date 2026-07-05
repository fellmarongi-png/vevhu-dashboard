-- Migration: publish_form_schema RPC
-- Fixes race condition where two concurrent publishes can both deactivate all
-- schemas and then both insert new active ones, resulting in two active schemas.
-- This RPC wraps the deactivate + insert in a single transaction with row-level
-- locking (FOR UPDATE) to serialize concurrent calls.

CREATE OR REPLACE FUNCTION publish_form_schema(
  schema_sections jsonb,
  schema_version integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Lock and deactivate all currently active schemas.
  -- SELECT ... FOR UPDATE ensures concurrent calls serialize here.
  PERFORM id FROM form_schemas WHERE is_active = true FOR UPDATE;
  UPDATE form_schemas SET is_active = false WHERE is_active = true;

  -- Insert the new active schema
  INSERT INTO form_schemas (id, version, name, fields, is_active, created_at, published_at)
  VALUES (
    gen_random_uuid(),
    schema_version,
    'Standard Form v' || schema_version,
    schema_sections,
    true,
    now(),
    now()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

