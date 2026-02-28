-- ─── knowledge_ingest_jobs ────────────────────────────────────────────────────
-- Tracks async ingestion work items. One row per document upload/reindex.
-- Workers claim jobs atomically via claim_knowledge_job() to avoid races.

create table if not exists knowledge_ingest_jobs (
  id          uuid        primary key default gen_random_uuid(),
  document_id uuid        not null references knowledge_documents(id) on delete cascade,
  status      text        not null default 'pending'
                check (status in ('pending', 'processing', 'done', 'error')),
  attempts    int         not null default 0,
  last_error  text,
  locked_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_kij_status_created on knowledge_ingest_jobs(status, created_at);
create index if not exists idx_kij_document_id    on knowledge_ingest_jobs(document_id);

-- ─── claim_knowledge_job ──────────────────────────────────────────────────────
-- Atomically picks one pending job, marks it processing, and returns it.
-- Uses FOR UPDATE SKIP LOCKED to prevent concurrent workers from double-claiming.
-- Also resets stuck 'processing' jobs older than 5 minutes back to 'pending'
-- so they are retried on the next cron tick.

create or replace function claim_knowledge_job()
returns setof knowledge_ingest_jobs
language plpgsql
as $$
declare
  claimed_id uuid;
begin
  -- Reset stuck jobs (processing > 5 min) so they can be retried
  update knowledge_ingest_jobs
  set    status     = 'pending',
         updated_at = now()
  where  status     = 'processing'
    and  locked_at  < now() - interval '5 minutes';

  -- Claim next pending job atomically
  select id
    into claimed_id
    from knowledge_ingest_jobs
   where status = 'pending'
   order by created_at asc
   limit 1
   for update skip locked;

  if claimed_id is null then
    return;
  end if;

  return query
    update knowledge_ingest_jobs
    set    status    = 'processing',
           attempts  = attempts + 1,
           locked_at = now(),
           updated_at = now()
    where  id = claimed_id
    returning *;
end;
$$;
