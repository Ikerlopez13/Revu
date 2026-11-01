-- Permisos del usuario de la app (revu_app), si existe. El rol y su contraseña
-- se crean a mano en Supabase (no van en el repo):
--   CREATE ROLE revu_app LOGIN PASSWORD '...';
-- Solo puede leer/escribir en el schema revu; nada del resto del proyecto.
DO $$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'revu_app') THEN
    RETURN;
  END IF;
  GRANT USAGE ON SCHEMA "revu" TO revu_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "revu" TO revu_app;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "revu" TO revu_app;
  REVOKE ALL ON "revu"."__drizzle_migrations" FROM revu_app;
  ALTER DEFAULT PRIVILEGES IN SCHEMA "revu" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO revu_app;
  ALTER DEFAULT PRIVILEGES IN SCHEMA "revu" GRANT USAGE, SELECT ON SEQUENCES TO revu_app;
  -- RLS está activo en todas las tablas: política explícita solo para revu_app.
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'revu' AND tablename <> '__drizzle_migrations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS revu_app_all ON "revu".%I', t);
    EXECUTE format('CREATE POLICY revu_app_all ON "revu".%I FOR ALL TO revu_app USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
