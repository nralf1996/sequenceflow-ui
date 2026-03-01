-- ─── Layer 2: Tenant Intelligence Foundation ──────────────────────────────────
-- Introduces the multi-tenant data model for SupportFlow OS.
-- These tables sit alongside the existing knowledge_* tables without modifying them.
-- Each tenant gets isolated config, templates, and an append-only event log.
--
-- Migration order:
--   001_knowledge_tables.sql      → vector search infrastructure
--   002_knowledge_ingest_jobs.sql → async ingest worker queue
--   003_multi_tenant_foundation.sql (this file) → tenant intelligence layer

-- gen_random_uuid() requires pgcrypto on Postgres < 13.
-- On Postgres 13+ it is built-in; this is a safe no-op in both cases.
create extension if not exists pgcrypto;


-- ─── tenants ──────────────────────────────────────────────────────────────────
-- Root entity for each customer/organisation using SupportFlow OS.
-- All tenant-scoped tables reference this via tenant_id.

create table if not exists tenants (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  industry     text        null,       -- e.g. 'ecommerce', 'saas', 'retail'
  website_url  text        null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_t_name on tenants(name);


-- ─── tenant_agent_config ──────────────────────────────────────────────────────
-- One-to-one with tenants. Stores per-tenant agent behaviour settings.
-- Mirrors the current flat agent-config.json structure but scoped to a tenant.
-- language_default controls which i18n dictionary the agent uses for replies.

create table if not exists tenant_agent_config (
  tenant_id            uuid        primary key references tenants(id) on delete cascade,
  empathy_enabled      boolean     not null default true,
  allow_discount       boolean     not null default false,
  max_discount_amount  numeric     not null default 0,
  signature            text,
  language_default     text        not null default 'nl',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- tenant_id is already the PK; explicit index supports FK lookups from child tables.
create index if not exists idx_tac_tenant_id on tenant_agent_config(tenant_id);


-- ─── tenant_templates ─────────────────────────────────────────────────────────
-- Per-tenant reply templates keyed by detected intent (e.g. 'damage', 'refund').
-- Multiple versions per intent are supported; only is_active = true are used at
-- runtime. confidence_weight adjusts how strongly this template is preferred
-- when multiple candidates match.

create table if not exists tenant_templates (
  id                 uuid        primary key default gen_random_uuid(),
  tenant_id          uuid        not null references tenants(id) on delete cascade,
  intent             text        not null,  -- e.g. 'damage', 'refund', 'shipping'
  template_version   integer     not null default 1,
  template_text      text        not null,
  variables          jsonb       not null default '{}'::jsonb,  -- placeholder definitions
  confidence_weight  numeric     not null default 1,
  is_active          boolean     not null default true,
  created_at         timestamptz not null default now()
);

-- Composite index: primary lookup path (resolve active template for a tenant+intent)
create index if not exists idx_tt_tenant_intent on tenant_templates(tenant_id, intent);
create index if not exists idx_tt_tenant_id     on tenant_templates(tenant_id);
create index if not exists idx_tt_intent        on tenant_templates(intent);


-- ─── support_events ───────────────────────────────────────────────────────────
-- Append-only observability log. One row per request through the AI pipeline.
-- Replaces the local data/support-logs.jsonl file with a queryable, tenant-scoped
-- table. Used by the dashboard to compute KPIs without scanning flat files.
--
-- outcome values (not enforced by check — kept flexible for iteration):
--   'auto'          → sent without human review
--   'auto_reply'    → deterministic template fired
--   'human_review'  → routed to agent inbox
--   'error'         → pipeline failure

create table if not exists support_events (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid        not null references tenants(id) on delete cascade,
  request_id   text,                   -- idempotency / correlation with generate route logs
  source       text,                   -- 'gmail', 'api', 'preview', etc.
  subject      text,
  intent       text,                   -- classified intent label
  confidence   numeric,                -- 0–1 final confidence score
  template_id  uuid        null,       -- FK to tenant_templates if a template was used
  latency_ms   integer,                -- end-to-end wall time in milliseconds
  draft_text   text,                   -- full generated draft (for audit / fine-tuning)
  outcome      text,                   -- see values above
  created_at   timestamptz not null default now()
);

create index if not exists idx_se_tenant_id      on support_events(tenant_id);
create index if not exists idx_se_tenant_created on support_events(tenant_id, created_at);
create index if not exists idx_se_intent         on support_events(intent);
