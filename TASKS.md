# Tasks & Handoff — Migração para a stack Greenfield

Arquivo de controle da migração do Selos do Dia para a stack padrão do template
`Greenfield` (`C:\Users\daney\OneDrive\Desktop\Greefield`): Next.js 16 + React 19.2 +
Tailwind 4 + Supabase (auth, banco, storage), substituindo o Vercel Blob (que
esgotou a cota de Advanced Operations do plano Hobby) e as duas senhas
compartilhadas (admin/visualizador) por Supabase Auth com papéis.

Trabalho feito em branch separada (`feat/supabase-migration`), sem tocar a
`main` (que continua em produção com o fix de `list()`→`head()` já aplicado).

## Decisões registradas

- 2026-09-17 — Escopo confirmado com o usuário: stack completa (Next 16 +
  Tailwind 4 + Supabase Storage) **e** troca de autenticação para Supabase Auth
  com papéis (admin/viewer), em vez de manter as senhas únicas compartilhadas.
- 2026-09-17 — Projeto Supabase novo e dedicado `selos-do-dia` (ref
  `ddgumntklqbwzfyshnbt`, região `sa-east-1`, mesma org do Greenfield),
  isolado do projeto `greenfield` (que é só o template).
- 2026-09-17 — Schema consolida os três blobs JSON antigos (`_index.json`,
  `_order.json`, `_annotations.json`) numa única tabela `selos` no Postgres:
  cada imagem é uma linha com `position` (substitui `_order.json`) e
  `approved`/`rejected`/`note` (substitui `_annotations.json`) direto nas
  colunas — sem mais arquivos JSON auxiliares no storage.
- 2026-09-17 — Ordem de execução: upgrade de framework primeiro (sequencial,
  toca `package.json`/config compartilhados), depois auth e storage em
  paralelo (arquivos praticamente disjuntos), coordenados/mesclados por mim.

## Status atual

Em andamento. Ver checklist abaixo.

## Plano

### Fase 1 — Upgrade de framework (sequencial, feito antes do resto)
- [ ] Next.js 15.5 → 16, React 19.0 → 19.2, Tailwind 3 → 4
- [ ] `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` (ou
  remoção, se o Tailwind 4 não usar mais arquivo de config) atualizados
- [ ] Build, lint e typecheck passando sem erros
- [ ] Nenhuma mudança de comportamento/lógica de negócio nesta fase — só
  framework

### Fase 2 — Fundação Supabase compartilhada (feita por mim, não pelos agentes,
para as duas frentes abaixo partirem do mesmo ponto sem conflito)
- [x] Projeto Supabase `selos-do-dia` criado e linkado via CLI
- [x] `.env.local` preenchido (URL, anon key, service role key)
- [ ] `src/lib/supabase/{client,server,proxy}.ts` + `src/proxy.ts` copiados
  do Greenfield
- [ ] `@supabase/ssr` + `@supabase/supabase-js` adicionados ao `package.json`

### Fase 3a — Autenticação (paralelo, em worktree próprio)
- [ ] Migration `profiles` (id, role: admin|viewer) com RLS, trigger a partir
  de `auth.users` (padrão do Greenfield)
- [ ] Páginas `/login` (e `/signup` se fizer sentido para criar o primeiro
  admin) adaptadas do Greenfield
- [ ] `src/proxy.ts` protege `/admin` (só role admin) e a galeria pública
  (só usuário autenticado, qualquer papel) — substitui `ViewerGate.tsx` e o
  cookie de senha de visualização
- [ ] `api/auth` e `api/viewer-auth` removidos (substituídos pelo fluxo
  Supabase Auth) ou adaptados
- [ ] `x-admin-password` header removido de `upload`/`delete`/`reorder`;
  checagem de role admin via sessão Supabase no servidor
- [ ] `.env.example` criado/atualizado documentando as chaves Supabase

### Fase 3b — Storage e dados (paralelo, em worktree próprio)
- [ ] Migration `selos` (filename, name, storage_path, uploaded_at, position,
  approved, rejected, note) com RLS (leitura pública, escrita só admin)
- [ ] Bucket público `selos` criado no Supabase Storage
- [ ] `api/images` (GET) lê da tabela `selos` (Postgres), não do Blob nem do
  fallback local
- [ ] `api/upload` grava no bucket + insere linha na tabela
- [ ] `api/delete` remove do bucket + deleta linha(s)
- [ ] `api/reorder` atualiza a coluna `position` em vez de reescrever
  `_order.json`
- [ ] `api/annotations` decomposto: aprovar/rejeitar/nota viram `UPDATE` na
  própria linha da tabela `selos` (rota pode até deixar de existir,
  dependendo de como o admin front-end for ajustado)
- [ ] Script de migração de dados: sobe as 5 imagens de `public/selos/` para
  o bucket e cria as linhas correspondentes na tabela
- [ ] `@vercel/blob` removido do `package.json` depois que nada mais o usa

### Fase 4 — Integração final (sequencial, feita por mim)
- [ ] Merge das duas branches/worktrees na `feat/supabase-migration`,
  resolvendo conflitos (esperado: mínimos, arquivos praticamente disjuntos)
- [ ] Build + lint + typecheck da árvore final
- [ ] Teste manual local (`npm run dev`): login, upload, aprovar/rejeitar,
  reordenar, exclusão, galeria pública
- [ ] Variáveis de ambiente novas adicionadas no projeto Vercel (Production)
- [ ] Merge para `main` e push (deploy automático via integração Git já
  configurada)
- [ ] `TASKS.md` atualizado com o resultado final

## Notas para quem retomar este trabalho

- A `main` está estável e no ar — essa migração não é urgente para o site
  continuar funcionando, é uma melhoria estrutural. Pode ser interrompida e
  retomada sem pressa.
- Credenciais do Supabase deste projeto estão em `.env.local` (não
  versionado) e no painel supabase.com, projeto `selos-do-dia`.
