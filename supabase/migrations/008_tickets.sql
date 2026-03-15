/*
  008_tickets.sql — Tickets table for SupportFlow OS inbox

  Multi-tenant report:
  - tenants table: YES — confirmed from schema (id, name, industry, website_url, created_at)
  - tenant_id on all tables: MOSTLY — knowledge_documents uses client_id (not tenant_id), this is a
    known discrepancy. All other tables (tenant_members, tenant_integrations, tenant_agent_config,
    support_events, support_agents, tenant_templates) correctly use tenant_id.
  - RLS enabled: UNKNOWN from schema alone. Added below for tickets table.
  - New user auto-assigned tenant: UNCLEAR — no auth callback or profiles trigger was found that
    auto-assigns a tenant_id on signup. The profiles table has tenant_id but assignment appears manual
    or handled outside migrations (e.g. via invite flow or manual insert in tenant_members).
  - Multi-tenant team: YES — tenant_members allows multiple users per tenant (user_id + tenant_id).
*/

create table if not exists tickets (
  id                 uuid        primary key default gen_random_uuid(),
  tenant_id          uuid        not null references tenants(id),
  gmail_message_id   text,
  gmail_thread_id    text,
  from_email         text        not null,
  from_name          text,
  subject            text        not null,
  body_text          text,
  intent             text,
  confidence         numeric,
  status             text        not null default 'draft'
                                 check (status in ('draft', 'approved', 'escalated', 'sent', 'ignored')),
  ai_draft           text,
  agent_notes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists tickets_tenant_id_idx   on tickets (tenant_id);
create index if not exists tickets_created_at_idx  on tickets (created_at desc);

alter table tickets enable row level security;

create policy "tenant_isolation" on tickets
  using (
    tenant_id = (
      select tenant_id from tenant_members
      where user_id = auth.uid()
      limit 1
    )
  );
