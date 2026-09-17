-- Encurtador de link de convite: o link do Supabase Auth (`generateLink`)
-- é gigante (domínio do projeto + token longo na query string), ruim de
-- compartilhar por WhatsApp/e-mail manualmente. Guarda um código curto
-- gerado no servidor apontando pro link real, resolvido pela rota pública
-- `GET /i/[code]`.

create table public.invite_short_links (
  code        text primary key,
  target_url  text not null,
  created_at  timestamptz not null default now()
);

comment on table public.invite_short_links is
  'Mapeia um código curto (?ex.: 8 chars alfanuméricos) para o action_link '
  'longo gerado pelo Supabase Auth em generateLink. Sem expiração/limpeza '
  'automática por enquanto: o token de convite do Supabase já expira '
  'sozinho, então o pior caso é o link curto apontar para um link expirado, '
  'que dá erro no próprio /auth/confirm.';

alter table public.invite_short_links enable row level security;

-- Nenhuma policy pública: só a service role (que bypassa RLS) cria/lê essas
-- linhas, via a rota POST /api/members (protegida por requireAdmin()) e a
-- rota pública de redirect GET /i/[code] (que usa o client admin, não o
-- client de sessão do usuário).
