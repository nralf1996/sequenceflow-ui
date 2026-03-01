-- ─── Layer 5: user_id tracking on support_events ───────────────────────────────
-- Every support event is now attributable to the authenticated Supabase user
-- (browser session or Bearer machine user).  Column is nullable so existing
-- rows and any unauthenticated-path inserts remain valid.
--
-- Migration order:
--   001_knowledge_tables.sql         → vector search infrastructure
--   002_knowledge_ingest_jobs.sql    → async ingest worker queue
--   003_multi_tenant_foundation.sql  → tenants, tenant_agent_config, support_events
--   004_profiles_rls.sql             → auth user → tenant binding + RLS
--   005_support_events_user_id.sql   (this file) → per-user observability

ALTER TABLE support_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_se_user_id
  ON support_events(user_id);
