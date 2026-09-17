# Tasks & Handoff — Migração para a stack Greenfield

Arquivo de controle da migração do Selos do Dia para a stack padrão do template
`Greenfield` (`C:\Users\daney\OneDrive\Desktop\Greefield`): Next.js 16 + React 19.2 +
Tailwind 4 + Supabase (auth, banco, storage), substituindo o Vercel Blob (que
esgotou a cota de Advanced Operations do plano Hobby) e as duas senhas
compartilhadas (admin/visualizador) por Supabase Auth com papéis.

Trabalho feito em branch separada (`feat/supabase-migration`), sem tocar a
`main` (que continua em produção com o fix de `list()`→`head()` já aplicado).

## Pós-migração — ajustes de UI e fluxo de convite (2026-09-17, mesma branch)

Depois da migração original (Fases 1-4 abaixo), seguiram-se pedidos incrementais
do usuário, todos ainda na branch `feat/supabase-migration`, sem push:

- [x] Correção de bug real: `* { margin: 0; padding: 0; }` fora de `@layer` em
  `globals.css` quebrava `mx-auto` (e qualquer utilitário de margin/padding)
  em TODO o site, por causa de como Cascade Layers funcionam no Tailwind 4
  (regra fora de layer sempre vence sobre `@layer utilities`, independente de
  especificidade). Corrigido movendo o reset pra dentro de `@layer base`.
- [x] Tipografia: títulos em Barlow Condensed (Google Fonts, via `next/font`),
  itálico, maiúsculo — alternativa gratuita à Acumin/Acumin Condensed
  (comerciais, não disponíveis pra web).
- [x] Login redesenhado em layout split-screen (formulário + painel visual),
  com foto de fundo dinâmica (sorteada entre os selos publicados no Supabase
  a cada carregamento), logo maior (`h-24`), e diferenciação visual quando a
  origem do acesso é `/admin` (`?intent=admin` setado pelo proxy) vs a
  galeria pública — cosmético apenas, a checagem real de papel continua no
  proxy/`profiles.role`.
- [x] **Fluxo de convite e gestão de membros** (admin e viewer), já que não
  existe cadastro público:
  - `src/lib/supabase/admin.ts` — client com a service role key (`server-only`,
    nunca importar de Client Component).
  - `POST /api/members` convida por e-mail (`auth.admin.inviteUserByEmail`) e
    define o papel (`viewer` por padrão via trigger, promovido a `admin` se
    pedido); `GET /api/members` lista todos; `PATCH`/`DELETE
    /api/members/[id]` trocam papel/removem acesso (admin não pode
    rebaixar/remover a própria conta).
  - `src/app/auth/confirm/route.ts` (`verifyOtp`) + `/definir-senha` — fluxo
    de quem recebe o convite definir a própria senha antes de entrar.
  - `src/app/admin/membros/page.tsx` — tela de convite/gestão dentro do
    `/admin`.
  - Configurado no painel do Supabase (projeto `ddgumntklqbwzfyshnbt`):
    `uri_allow_list` liberando `http://localhost:3000/**` e
    `https://selos-do-dia.vercel.app/**`, e `disable_signup: true`
    (cadastro público desabilitado no projeto — só convite admin cria conta).
  - **Limitação conhecida**: o envio de e-mail usa o serviço embutido do
    Supabase (sem SMTP próprio configurado), que tem um limite bem baixo de
    e-mails/hora no plano gratuito — testado e confirmado batendo nesse
    limite ao convidar duas vezes seguidas rápido demais. Para uso real com
    volume, considerar configurar um provedor de SMTP próprio (painel do
    Supabase → Authentication → Emails) antes de convidar muita gente de
    uma vez.
  - Testado de ponta a ponta contra o Supabase real (e-mail descartável,
    depois removido) pela sessão que implementou — convite, criação do
    perfil via trigger, promoção a admin e remoção funcionaram.

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
- [x] Next.js 15.5 → 16, React 19.0 → 19.2, Tailwind 3 → 4
- [x] `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` (ou
  remoção, se o Tailwind 4 não usar mais arquivo de config) atualizados
- [x] Build, lint e typecheck passando sem erros
- [x] Nenhuma mudança de comportamento/lógica de negócio nesta fase — só
  framework

  Concluído em 2026-09-17. Detalhes/decisões: `next` 16.3.5, `react`/
  `react-dom` 19.2.8, `tailwindcss` 4.3.3 (mesmas versões do Greenfield).
  `tailwind.config.ts` removido; cores da marca migradas para `@theme` em
  `globals.css`. `next lint` (removido no Next 16) trocado por `eslint`
  direto com `eslint.config.mjs` (flat config, igual ao Greenfield).
  Ajustes exigidos pelo upgrade: `revalidateTag()` agora exige um segundo
  argumento — usado `{ expire: 0 }` nas 4 chamadas existentes para manter
  o comportamento anterior (invalidação imediata); `next build` trocou
  `tsconfig.json` `jsx` de `preserve` para `react-jsx` automaticamente;
  `scripts/generate-manifest.js` e `scripts/generate-docs-gallery.js`
  convertidos para `.mjs` (ESM) por causa da regra
  `@typescript-eslint/no-require-imports`; `<a href="/...">` internos
  trocados por `<Link>` do `next/link` em `admin/page.tsx` e
  `EditorClient.tsx` (regra `@next/next/no-html-link-for-pages`). Build e
  typecheck limpos. Lint tem 4 erros remanescentes, não triviais,
  causados por regras novas do React Compiler/`eslint-plugin-react-hooks`
  v6 (bundladas no `eslint-config-next` 16) que já existiam no código
  antes do upgrade mas nunca tinham sido lintadas (não havia
  `eslint.config`/`.eslintrc` no projeto): `react-hooks/set-state-in-effect`
  em `src/app/admin/page.tsx:47` e `src/components/ViewerGate.tsx:38`
  (setState direto dentro de `useEffect`), e
  `react-hooks/immutability`/`preserve-manual-memoization` em
  `src/app/admin/page.tsx:48,54` (`fetchImages` usado antes de ser
  declarado dentro do próprio `useEffect` de restauração de sessão).
  Corrigir exige reordenar/reestruturar esses componentes, o que é
  mudança de lógica de UI fora do escopo desta fase — ficou documentado
  aqui para tratamento em separado, sem regra silenciada/ignorada.

### Fase 2 — Fundação Supabase compartilhada (feita por mim, não pelos agentes,
para as duas frentes abaixo partirem do mesmo ponto sem conflito)
- [x] Projeto Supabase `selos-do-dia` criado e linkado via CLI
- [x] `.env.local` preenchido (URL, anon key, service role key)
- [ ] `src/lib/supabase/{client,server,proxy}.ts` + `src/proxy.ts` copiados
  do Greenfield
- [ ] `@supabase/ssr` + `@supabase/supabase-js` adicionados ao `package.json`

### Fase 3a — Autenticação (paralelo, em worktree próprio)
- [x] Migration `profiles` (id, role: admin|viewer) com RLS, trigger a partir
  de `auth.users` (padrão do Greenfield) — aplicada via `supabase db push`;
  primeiro admin (`daneybru@gmail.com`) criado manualmente via service role
- [x] Página `/login` adaptada do Greenfield (sem `/signup` — app interno,
  novos usuários/admins são criados manualmente via service role, não há
  cadastro público)
- [x] `src/proxy.ts` protege `/admin` (só role admin) e a galeria pública
  (só usuário autenticado, qualquer papel) — substitui `ViewerGate.tsx` e o
  cookie de senha de visualização
- [x] `api/auth` e `api/viewer-auth` removidos (substituídos pelo fluxo
  Supabase Auth)
- [ ] `x-admin-password` header removido de `upload`/`delete`/`reorder`;
  checagem de role admin via sessão Supabase no servidor — depende da frente
  de storage (arquivos fora do escopo desta worktree); helper pronto em
  `src/lib/auth/requireAdmin.ts` para ser chamado dentro dessas rotas
- [x] `.env.example` criado/atualizado documentando as chaves Supabase

### Fase 3b — Storage e dados (paralelo, em worktree próprio)
- [x] Migration `selos` (filename, name, storage_path, uploaded_at, position,
  approved, rejected, note) com RLS (leitura pública, escrita só admin)
- [x] Bucket público `selos` criado no Supabase Storage
- [x] `api/images` (GET) lê da tabela `selos` (Postgres), não do Blob nem do
  fallback local
- [x] `api/upload` grava no bucket + insere linha na tabela
- [x] `api/delete` remove do bucket + deleta linha(s)
- [x] `api/reorder` atualiza a coluna `position` em vez de reescrever
  `_order.json`
- [x] `api/annotations` decomposto: aprovar/rejeitar/nota viram `UPDATE` na
  própria linha da tabela `selos` (rota mantida, sem checagem de admin —
  intencional, igual ao comportamento anterior)
- [x] Script de migração de dados: sobe as 5 imagens de `public/selos/` para
  o bucket e cria as linhas correspondentes na tabela
- [x] `@vercel/blob` removido do `package.json` depois que nada mais o usa

  Concluído em 2026-09-17 (worktree `wt-storage`, branch
  `feat/supabase-storage`). Decisões/trade-offs:
  - Migration `supabase/migrations/20260917142410_create_selos.sql` aplicada
    via `npx supabase db push` (não SQL manual/dashboard). O bucket `selos`
    foi criado por `insert into storage.buckets` dentro da própria migration
    (não via script Node separado) — manter tudo versionado numa migration
    só pareceu mais simples e igualmente confiável. Ao rodar `db push` a
    primeira vez, houve o conflito esperado com a migration
    `20260917142311` aplicada quase ao mesmo tempo pela frente de Auth
    (paralela); resolvido criando um arquivo placeholder local
    `20260917142311_remote_placeholder_auth.sql` (comentário explicando que
    é só um placeholder, o conteúdo real virá no merge da Fase 4) para
    destravar o `db push`, sem repair/força bruta no histórico remoto.
  - RLS de escrita em `public.selos` e em `storage.objects` (bucket `selos`)
    usa `to authenticated` / `auth.role() = 'authenticated'`, não a
    subquery em `public.profiles` sugerida como alternativa mais fina —
    porque `profiles` ainda não existia no momento desta migration (é
    entregue pela frente de Auth). Documentado na própria migration como
    melhoria de defesa em profundidade recomendada para depois que
    `profiles` existir. A checagem fina "só admin" já é feita em código via
    `requireAdmin()` nas rotas de escrita.
  - `requireAdmin()` (`src/lib/auth/requireAdmin.ts`) ainda não existia
    nesta worktree — criado aqui como **stub temporário** (sempre retorna
    `{ ok: true, userId: 'stub' }`, comentário `// TODO` explícito) só para
    as rotas de upload/delete/reorder poderem chamá-lo sem travar. Deve ser
    sobrescrito pela implementação real da frente de Auth no merge da
    Fase 4.
  - Contrato de `DELETE /api/delete` e `POST /api/reorder` mudou de URLs
    públicas (`url`/`urls`, `order` de `src`) para `filename`/`filenames` —
    evita reconstruir a `storage_path` a partir da URL pública do Supabase e
    reusa o identificador que já é estável em toda a app (anotações já são
    chaveadas por `filename`). `admin/page.tsx` (único consumidor) foi
    ajustado de acordo.
  - `storage_path` é uma versão "slugificada" ASCII do nome do arquivo
    (sem acentos/travessão) porque a API do Supabase Storage rejeita chaves
    com esses caracteres (`400 InvalidKey`); `filename`/`name` na tabela
    continuam com o nome original para exibição.
  - Tela de senha e header `x-admin-password` removidos de
    `src/app/admin/page.tsx`; a página carrega os dados direto num
    `useEffect` de montagem (a proteção de rota é responsabilidade do
    `proxy.ts` da frente de Auth).
  - Validado: `npm run build` e `npm run lint` (2 erros remanescentes, não
    triviais, mesma categoria já documentada na Fase 1 — ver nota abaixo);
    `npm run dev` + `curl` confirmando que `GET /api/images` devolve as 5
    imagens com URLs públicas do Supabase, e que cada URL retorna
    `200 OK`/`Content-Type: image/*` com o tamanho de arquivo correto;
    testado também que upload sem sessão autenticada é bloqueado pela RLS
    (esperado, já que o stub de `requireAdmin` não impede nada sozinho — a
    RLS do banco é a barreira real até a Fase 4).
  - Lint: `react-hooks/set-state-in-effect` (React Compiler,
    `eslint-config-next` 16) ainda aponta 1 erro em `src/app/admin/page.tsx`
    (efeito de carregamento inicial chamando `fetchImages`, que faz
    `setLoading(true)` antes do primeiro `await` — é o próprio padrão de
    data-fetching documentado em react.dev) e 1 em `src/components/
    ViewerGate.tsx` (fora do meu escopo, já documentado na Fase 1). Não
    corrigidos de propósito — corrigir exigiria reestruturar para Server
    Components/`use()`, fora do escopo desta fase; comentário explicativo
    deixado no código em vez de silenciar a regra.

### Fase 4 — Integração final (sequencial, feita por mim)
- [x] Merge das duas branches (`feat/supabase-auth`, depois
  `feat/supabase-storage`) na `feat/supabase-migration`. Único conflito real:
  `src/lib/auth/requireAdmin.ts` (add/add — a frente de storage criou um stub
  temporário porque o arquivo real ainda não existia na hora dela começar);
  resolvido mantendo a implementação real da frente de Auth. O arquivo
  placeholder de migration (`20260917142311_remote_placeholder_auth.sql`,
  criado pela frente de storage só pra destravar `supabase db push` local)
  foi removido no merge — a migration real (`create_profiles.sql`) já veio
  junto da branch de auth.
- [x] Build + lint + typecheck da árvore final — build e typecheck limpos.
  Lint: restam os mesmos 2 erros não-triviais já documentados na Fase 1/3
  (`react-hooks/set-state-in-effect` em `admin/page.tsx` e `ViewerGate.tsx`,
  padrão idiomático de fetch-on-mount, regra experimental do React Compiler).
- [x] Teste manual (parcial): login via Supabase Auth confirmado
  programaticamente (email/senha do admin válidos, `profiles.role = 'admin'`
  correto); tabela `selos` confirmada com as 5 linhas migradas; proxy
  confirmado redirecionando `/`, `/admin` e `/api/images` pra `/login` quando
  não autenticado. **Não foi possível testar o fluxo de login pelo navegador
  de verdade** neste ambiente — mesma limitação já registrada no `TASKS.md`
  do Greenfield (Claude in Chrome não alcança `localhost` desta máquina).
  Recomendo ao usuário testar manualmente em `npm run dev` antes de confiar
  100% no fluxo de UI.
- [ ] Variáveis de ambiente novas adicionadas no projeto Vercel (Production)
  — pendente, depende do usuário decidir quando fazer o deploy
- [ ] Merge para `main` e push — **pendente, aguardando confirmação do
  usuário**: esta migração troca a autenticação (senha única → login por
  conta Supabase), o que muda como as pessoas acessam o site em produção.
  Não fazer merge/push sem o usuário estar ciente disso e sem as env vars já
  configuradas na Vercel (o deploy quebraria a galeria/admin em produção sem
  elas).
- [x] `TASKS.md` atualizado com o resultado final

## Segurança — limitação conhecida (não bloqueante, documentar e decidir depois)

As policies de RLS de escrita em `public.selos` e `storage.objects` liberam
qualquer usuário autenticado (`to authenticated`), não só admins — a
restrição fina "só admin" pra upload/exclusão/reordenação é feita em código
(`requireAdmin()` nas rotas de API), não no banco. Na prática, um usuário
"viewer" mal-intencionado que soubesse usar a API REST do Supabase
diretamente (com a `anon key`, que é pública) poderia contornar essa checagem
de app e escrever na tabela/bucket direto. Isso é aceitável para um app
interno de poucos usuários confiáveis, mas se o número de contas "viewer"
crescer, vale endurecer as policies de `insert`/`update`/`delete` em `selos`
e `storage.objects` para checar
`exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`
em vez de só `to authenticated` — como já fica anotado na própria migration
`20260917142410_create_selos.sql`. Isso quebraria a rota `annotations`
(que precisa que QUALQUER autenticado escreva `approved`/`rejected`/`note`),
então essa melhoria exigiria também separar a policy de update por coluna
(ex. via trigger) ou mover annotations pra uma tabela própria com policy
mais aberta. Não implementado agora por ser fora do escopo pedido.

## Notas para quem retomar este trabalho

- A `main` está estável e no ar — essa migração não é urgente para o site
  continuar funcionando, é uma melhoria estrutural. Pode ser interrompida e
  retomada sem pressa.
- Credenciais do Supabase deste projeto estão em `.env.local` (não
  versionado) e no painel supabase.com, projeto `selos-do-dia`.
