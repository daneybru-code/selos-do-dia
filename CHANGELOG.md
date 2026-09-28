# Changelog

Todas as mudanças relevantes do projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento em [SemVer](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`):

- **MAJOR**: muda algo que quebra o uso atual (ex.: remove uma tela, muda um
  contrato de API de forma incompatível).
- **MINOR**: adiciona funcionalidade nova, sem quebrar o que já existia.
- **PATCH**: correção de bug, ajuste visual, ou mudança interna sem efeito
  visível pro usuário.

Histórico anterior à `0.2.0` (migração pra Next 16 + Supabase, fluxo de
convite, recuperação de senha, etc.) não foi versionado retroativamente —
ver `TASKS.md` e `git log` pra esse período.

## [Unreleased]

## [0.2.0] - 2026-09-28

### Adicionado
- Botões de baixar e compartilhar (WhatsApp) em cada selo — nas miniaturas da
  galeria e na visualização ampliada. Compartilhar tenta primeiro o menu
  nativo do celular (com a imagem anexada) e cai num link `wa.me` quando o
  navegador não suporta.
- Ícones SVG universais (download / compartilhar) no lugar dos emojis usados
  na primeira versão do recurso acima.
- Atalho "Painel admin" no cabeçalho da galeria, visível só para usuários com
  role `admin`, para voltar ao `/admin` sem precisar digitar a URL.
