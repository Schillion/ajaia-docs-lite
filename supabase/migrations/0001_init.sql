-- Ajaia Docs Lite: initial schema
-- Run against your Supabase Postgres instance (SQL editor, psql, or `npm run db:migrate`).

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled document',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_owner_id_idx on documents(owner_id);
create index if not exists documents_updated_at_idx on documents(updated_at desc);

create table if not exists document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  permission text not null default 'editor' check (permission in ('editor')),
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create index if not exists document_shares_user_id_idx on document_shares(user_id);
create index if not exists document_shares_document_id_idx on document_shares(document_id);

-- All access to this schema goes through the app's service-role Supabase
-- client; authorization is enforced in application code
-- (src/lib/access-control.ts), not via Postgres RLS. Row Level Security is
-- left disabled by default so the service-role key can perform the checked
-- operations the app issues. If you expose these tables to any other client
-- (e.g. the anon key), enable RLS and add matching policies first.
