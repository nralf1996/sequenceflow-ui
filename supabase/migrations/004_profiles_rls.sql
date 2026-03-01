-- ─── Layer 3: Auth-scoped tenant resolution ────────────────────────────────────
-- Links every Supabase Auth user to exactly one tenant.
-- getTenantId() queries this table to resolve the calling user's tenant.
--
-- Migration order:
--   001_knowledge_tables.sql         → vector search infrastructure
--   002_knowledge_ingest_jobs.sql    → async ingest worker queue
--   003_multi_tenant_foundation.sql  → tenants, tenant_agent_config, support_events
--   004_profiles_rls.sql (this file) → auth user → tenant binding + RLS


-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Stores which tenant the user belongs to
-- and their role within that tenant.

create table if not exists profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  tenant_id  uuid        not null references tenants(id) on delete cascade,
  role       text        not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant_id on profiles(tenant_id);


-- ─── RLS: profiles ────────────────────────────────────────────────────────────
-- Authenticated users may only read their own profile row.
-- Server-side routes use the service role key and bypass RLS entirely.

alter table profiles enable row level security;

do $$ begin
  create policy "profiles: authenticated user can read own row"
    on profiles
    for select
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;


-- ─── RLS: tenant_agent_config ─────────────────────────────────────────────────
-- Users may read / write config only for their own tenant.
-- (Server-side service role bypasses these policies.)

alter table tenant_agent_config enable row level security;

do $$ begin
  create policy "tenant_agent_config: tenant members can read"
    on tenant_agent_config
    for select
    using (
      tenant_id in (
        select tenant_id from profiles where id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "tenant_agent_config: tenant members can write"
    on tenant_agent_config
    for all
    using (
      tenant_id in (
        select tenant_id from profiles where id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;
