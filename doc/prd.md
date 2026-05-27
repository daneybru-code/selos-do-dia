# PRD — Product Requirements Document
## Selos do Dia | Globo Esporte

**Versão:** 1.0  
**Data:** 2026-05-27  
**Status:** Aprovado para desenvolvimento

---

## 1. Objetivo do Produto
Criar uma web app de galeria visual para consulta dos selos gráficos diários produzidos pelo time de arte do Globo Esporte, acessível via URL pública no Vercel, sem necessidade de instalação ou login.

---

## 2. Personas

### Persona A — Produtor de Arte
- **Nome:** Carla, 28 anos, designer do GE
- **Contexto:** Produz 6 a 15 selos por dia; precisa compartilhar com a equipe e verificar os finalizados
- **Dor:** Envia artes por e-mail ou WhatsApp; difícil rastrear a versão final de cada peça
- **Necessidade:** Um link único onde toda a equipe vê todos os selos do dia, com nome e imagem nítida

### Persona B — Editor de Conteúdo
- **Nome:** Ricardo, 35 anos, editor de esportes
- **Contexto:** Precisa checar se os selos de determinada partida estão prontos antes da publicação
- **Dor:** Precisa perguntar ao time de arte; processo lento
- **Necessidade:** Acesso rápido às imagens, ampliação para verificar texto e qualidade

---

## 3. User Stories

### US-01 — Visualizar galeria do dia
**Como** usuário da plataforma,  
**Quero** ver todos os selos do dia em uma grade visual,  
**Para** ter visão geral rápida de todas as peças produzidas.

**Critérios de Aceite:**
- [ ] A página exibe todas as imagens da pasta `public/selos/`
- [ ] Cada imagem aparece como thumbnail em proporção 16:9
- [ ] O nome do arquivo (sem extensão) aparece abaixo de cada thumbnail em amarelo ouro
- [ ] A grade é responsiva: 2 col (mobile) / 3 col (tablet) / 4 col (desktop)

### US-02 — Ver data do dia
**Como** usuário,  
**Quero** ver a data atual em destaque no topo da página,  
**Para** confirmar que estou vendo os selos do dia correto.

**Critérios de Aceite:**
- [ ] A data aparece no header, em português do Brasil: "quarta-feira, 27 de maio de 2026"
- [ ] A data é gerada dinamicamente no servidor
- [ ] A logo do Globo Esporte aparece centralizada acima do título
- [ ] O contador de selos do dia é exibido (ex.: "6 selos")

### US-03 — Ampliar imagem (lightbox)
**Como** usuário,  
**Quero** clicar em um selo para vê-lo em tamanho maior,  
**Para** revisar detalhes da arte sem baixar o arquivo.

**Critérios de Aceite:**
- [ ] Clicar na imagem abre um overlay (lightbox) com a imagem em tamanho máximo
- [ ] O nome da imagem aparece no topo do lightbox em amarelo ouro
- [ ] Um contador ("X / Y") indica a posição atual no conjunto
- [ ] Botão de fechar (×) no canto superior direito fecha o lightbox
- [ ] Clicar fora da imagem também fecha o lightbox

### US-04 — Navegar entre imagens no lightbox
**Como** usuário,  
**Quero** navegar entre as imagens sem fechar o lightbox,  
**Para** comparar selos rapidamente.

**Critérios de Aceite:**
- [ ] Setas visuais (‹ ›) permitem ir à imagem anterior/próxima
- [ ] Tecla `←` vai para a imagem anterior
- [ ] Tecla `→` vai para a imagem seguinte
- [ ] Tecla `ESC` fecha o lightbox
- [ ] Miniaturas de filmstrip na base do lightbox indicam posição
- [ ] A miniatura ativa tem borda laranja e escala maior

### US-05 — Acessar em dispositivos diferentes
**Como** usuário mobile,  
**Quero** consultar os selos pelo celular,  
**Para** ter acesso mesmo fora do escritório.

**Critérios de Aceite:**
- [ ] Layout responsivo funciona de 320px a 2560px
- [ ] Imagens redimensionam proporcionalmente
- [ ] Lightbox ocupa tela cheia em mobile
- [ ] Tap/touch funciona para abrir e fechar o lightbox

---

## 4. Requisitos Não-Funcionais

| Requisito       | Descrição                                                        |
|-----------------|------------------------------------------------------------------|
| Performance     | LCP < 2.5s; imagens com `loading="lazy"`                        |
| Responsividade  | Mobile-first, 320px a 2560px                                     |
| Acessibilidade  | Alt text em todas as imagens; navegação por teclado no lightbox  |
| Compatibilidade | Chrome, Firefox, Safari, Edge (últimas 2 versões)                |
| Disponibilidade | 99.9% SLA via Vercel Edge Network                                |
| SEO             | Meta tags básicas; título e description descritivos              |

---

## 5. Fora do Escopo (V1)
- Upload de imagens via interface web
- Autenticação de usuários
- Histórico de datas anteriores
- Busca por nome de selo
- Download de imagens
- Anotações ou comentários
- Múltiplos idiomas
- PWA / modo offline

---

## 6. Dependências e Riscos

| Item                              | Risco  | Mitigação                                              |
|-----------------------------------|--------|--------------------------------------------------------|
| Nomes com acentos e espaços       | Médio  | `encodeURIComponent` nos paths; testar todos os arquivos |
| Número crescente de imagens       | Baixo  | Lazy loading; grid otimizado para 50+ imagens          |
| Deploy manual (imagens no repo)   | Médio  | Documentar processo; avaliar Vercel Blob na V2         |

---

## 7. Métricas de Sucesso (V1)
- Primeiro selo visível em < 3 segundos
- Lightbox abre em < 200ms
- Zero erros de imagem não carregada em deploy padrão
- Feedback positivo do time de arte na primeira semana

---

## 8. Roadmap

### V2 — Organização por Data
- Suporte a subpastas por data (ex.: `public/selos/2026-05-27/`)
- Seletor de data no topo da página

### V3 — Upload via Interface
- Área de drag-and-drop para adicionar novos selos
- Integração com Vercel Blob para armazenamento sem commit

### V4 — CMS Leve
- Editar nome/título de cada selo via interface
- Categorias: jogos, atletas, retrospecto, coletiva...
- Notificações push quando novos selos são adicionados
