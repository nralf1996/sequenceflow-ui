-- Enable pgvector extension
create extension if not exists vector;

-- ─── knowledge_documents ─────────────────────────────────────────────────────
create table if not exists knowledge_documents (
  id          uuid        primary key default gen_random_uuid(),
  client_id   uuid        null,           -- null = platform (admin-wide)
  type        text        not null check (type in ('policy', 'training', 'platform')),
  title       text        not null,
  source      text,                       -- original stored filename
  mime_type   text,
  status      text        not null default 'pending'
                check (status in ('pending', 'processing', 'ready', 'error')),
  chunk_count int         not null default 0,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── knowledge_chunks ─────────────────────────────────────────────────────────
create table if not exists knowledge_chunks (
  id          uuid        primary key default gen_random_uuid(),
  document_id uuid        not null references knowledge_documents(id) on delete cascade,
  client_id   uuid        null,
  type        text        not null,
  chunk_index int         not null,
  content     text        not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_kd_client_id   on knowledge_documents(client_id);
create index if not exists idx_kd_type        on knowledge_documents(type);
create index if not exists idx_kc_document_id on knowledge_chunks(document_id);
create index if not exists idx_kc_client_id   on knowledge_chunks(client_id);
create index if not exists idx_kc_type        on knowledge_chunks(type);

-- IVFFlat index for fast approximate cosine similarity search
-- (Recreate with higher lists count when you have > 10k chunks)
create index if not exists idx_kc_embedding
  on knowledge_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── Similarity search function ───────────────────────────────────────────────
-- Returns chunks that are semantically similar to a query embedding.
-- filter_client_id = null → returns only platform chunks (client_id IS NULL)
-- filter_client_id = <uuid> → returns client chunks + platform chunks
create or replace function match_knowledge_chunks(
  query_embedding   vector(1536),
  filter_client_id  uuid,
  match_threshold   float,
  match_count       int
)
returns table (
  id          uuid,
  document_id uuid,
  client_id   uuid,
  type        text,
  chunk_index int,
  content     text,
  similarity  float
)
language sql stable
as $$
  select
    kc.id,
    kc.document_id,
    kc.client_id,
    kc.type,
    kc.chunk_index,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where
    kd.status = 'ready'
    and (
      kc.client_id is null                          -- always include platform docs
      or kc.client_id = filter_client_id            -- include client-specific docs
    )
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
