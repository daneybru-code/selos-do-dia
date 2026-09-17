-- Fase 3b — Storage e dados: tira imagens e metadados do Vercel Blob (cota de
-- Advanced Operations esgotada no plano Hobby) e move tudo para Supabase
-- Storage (arquivos) + Postgres (metadados), consolidando os antigos blobs
-- JSON auxiliares (_index.json, _order.json, _annotations.json) numa única
-- tabela `selos`.

-- ─────────────────────────────────────────────────────────────────────────
-- Tabela `public.selos`
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.selos (
  id            uuid primary key default gen_random_uuid(),
  filename      text not null,
  name          text not null,
  storage_path  text not null unique,
  uploaded_at   timestamptz not null default now(),
  "position"    integer,
  approved      boolean not null default false,
  rejected      boolean not null default false,
  note          text not null default ''
);

comment on table public.selos is
  'Metadados dos selos publicados (arquivo vive no bucket de Storage "selos"). '
  'Substitui os blobs JSON _index.json/_order.json/_annotations.json usados '
  'anteriormente no Vercel Blob.';

alter table public.selos enable row level security;

-- Leitura pública: a galeria pública já é protegida por sessão no proxy
-- (fora do escopo desta migration), não pela RLS da tabela.
create policy "selos_select_public"
  on public.selos
  for select
  using (true);

-- Escrita (insert/update/delete): qualquer usuário autenticado no Supabase
-- Auth. NOTA: a frente de trabalho de autenticação (paralela a esta) ainda
-- não tinha criado `public.profiles` no momento desta migration, então não
-- é possível referenciar essa tabela aqui sem quebrar a aplicação da
-- migration. Usamos `auth.role() = 'authenticated'` como policy de DB e
-- deixamos a checagem fina de "só admin" para `requireAdmin()` no código das
-- rotas de API (upload/delete/reorder). Quando `profiles` existir, trocar
-- estas três policies para checar
-- `exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`
-- é uma melhoria de defesa em profundidade recomendada, mas não bloqueante.
create policy "selos_insert_authenticated"
  on public.selos
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "selos_update_authenticated"
  on public.selos
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "selos_delete_authenticated"
  on public.selos
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────
-- Bucket de Storage `selos` (público)
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('selos', 'selos', true)
on conflict (id) do nothing;

-- Leitura pública dos objetos do bucket (bucket já é público, policy só
-- formaliza o acesso via API REST/Storage).
create policy "selos_storage_select_public"
  on storage.objects
  for select
  using (bucket_id = 'selos');

-- Escrita nos objetos do bucket: só usuários autenticados (mesma observação
-- sobre `profiles` acima se aplica aqui).
create policy "selos_storage_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'selos');

create policy "selos_storage_update_authenticated"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'selos')
  with check (bucket_id = 'selos');

create policy "selos_storage_delete_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'selos');
