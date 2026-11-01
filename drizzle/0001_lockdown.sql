-- El schema "revu" solo se usa desde el servidor (conexión directa a Postgres).
-- Bloqueamos la API pública de Supabase (roles anon/authenticated) por si alguien
-- expone el schema en PostgREST por error.
REVOKE ALL ON SCHEMA "revu" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA "revu" FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA "revu" REVOKE ALL ON TABLES FROM anon, authenticated;--> statement-breakpoint
ALTER TABLE "revu"."businesses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."tag_aliases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."scans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."tag_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "revu"."review_snapshots" ENABLE ROW LEVEL SECURITY;
