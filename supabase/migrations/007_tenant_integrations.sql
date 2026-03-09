-- ─── Tenant Integrations ──────────────────────────────────────────────────────
-- Stores OAuth tokens and connection status for third-party integrations
-- (Gmail, Bol.com, etc.) on a per-tenant basis.
--
-- Migration order:
--   006_tenant_members.sql (previous)
--   007_tenant_integrations.sql (this file)

create table if not exists tenant_integrations (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     text        not null,
  provider      text        not null,  -- e.g. 'gmail', 'bolcom'
  account_email text        null,      -- connected account identifier
  access_token  text        null,
  refresh_token text        null,
  expires_at    timestamptz null,      -- access token expiry
  status        text        not null default 'connected',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (tenant_id, provider)
);

create index if not exists idx_ti_tenant_id on tenant_integrations(tenant_id);
create index if not exists idx_ti_tenant_provider on tenant_integrations(tenant_id, provider);
