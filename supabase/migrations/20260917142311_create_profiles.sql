-- Tabela de perfil pública, espelhando auth.users (que fica em schema protegido).
-- Diferente do template Greenfield, este app tem papéis (role): 'admin' pode
-- gerenciar a galeria (upload/exclusão/reordenação), 'viewer' só visualiza.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário só lê o próprio perfil. Não há policy de update: o papel não
-- é autoatribuível — só é alterado manualmente via service role (ver
-- scripts/criação do primeiro admin).
create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

-- Cria a linha em public.profiles automaticamente quando um usuário é criado
-- em auth.users (signup ou criação via Admin API/service role). Papel inicial
-- é sempre 'viewer'; promoção a 'admin' é feita manualmente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
