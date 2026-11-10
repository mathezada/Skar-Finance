-- Execute este arquivo no SQL Editor do Supabase.
-- Cada usuário autenticado só poderá acessar os próprios dados financeiros.

create table if not exists public.finance_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"tx":[],"nid":1,"inv":[],"goals":[],"bud":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists finance_data_user_id_idx
  on public.finance_data using btree (user_id);

alter table public.finance_data enable row level security;

revoke all on table public.finance_data from anon;
grant select, insert, update, delete on table public.finance_data to authenticated;

drop policy if exists "Usuários visualizam os próprios dados" on public.finance_data;
create policy "Usuários visualizam os próprios dados"
  on public.finance_data for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Usuários criam os próprios dados" on public.finance_data;
create policy "Usuários criam os próprios dados"
  on public.finance_data for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam os próprios dados" on public.finance_data;
create policy "Usuários atualizam os próprios dados"
  on public.finance_data for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Usuários apagam os próprios dados" on public.finance_data;
create policy "Usuários apagam os próprios dados"
  on public.finance_data for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

