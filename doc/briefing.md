# Briefing — Selos do Dia | Globo Esporte

## Visão Geral
A equipe de arte do **Globo Esporte** produz diariamente peças gráficas chamadas "selos" — artes digitais usadas em plataformas sociais e editoriais, cobrindo jogos, atletas e conteúdos esportivos. Hoje, a consulta e organização dessas imagens é feita de forma manual, sem uma interface centralizada.

O projeto **Selos do Dia** é uma web app de consulta visual — uma galeria digital leve e elegante — que reúne todas as imagens do dia em uma única página, permitindo que qualquer membro da equipe visualize, amplie e consulte os selos com facilidade, de qualquer dispositivo e navegador.

---

## Problema
- Sem interface centralizada para visualizar os selos produzidos no dia
- Dificuldade de identificar rapidamente qual arte corresponde a qual evento
- Sem forma prática de ampliar e revisar os detalhes de cada peça
- Processo de consulta manual, demorado e não escalável

---

## Solução
Uma web app estática e responsiva, hospedada no Vercel, que:
1. Exibe automaticamente todos os selos do dia em grade visual
2. Apresenta o nome de cada imagem abaixo da miniatura
3. Permite clicar em qualquer selo para ampliar em lightbox com navegação
4. É atualizada via novo deploy a cada vez que novos selos são adicionados

---

## Público-Alvo
- **Primário:** Equipe de arte e produção do Globo Esporte
- **Secundário:** Editores, repórteres e coordenadores que precisam consultar as peças do dia

---

## Objetivos
- ✅ Centralizar a visualização dos selos diários em uma única URL
- ✅ Reduzir o tempo de consulta e identificação das artes
- ✅ Interface fiel à identidade visual do Globo Esporte
- ✅ Deploy simples e rápido via Vercel
- ✅ Funcionar em desktop e mobile sem instalação

---

## Identidade Visual
| Elemento           | Valor                                      |
|--------------------|--------------------------------------------|
| Cor primária (red) | `#CC0000`                                  |
| Cor secundária     | `#FF6600` (laranja)                        |
| Cor de acento      | `#FFC200` / `#F5C518` (amarelo ouro)       |
| Background         | `#0D0D0D` (quase preto)                    |
| Texto principal    | `#FFFFFF`                                  |
| Texto de destaque  | `#FFD700` (ouro)                           |
| Gradiente header   | `135deg: #CC0000 → #FF6600 → #FFC200`      |
| Fonte              | Arial / system-ui (sem webfont externa)    |

---

## Escopo (V1)
### Inclui
- Página única de galeria (sem menu, sem rotas múltiplas)
- Header com logo do Globo Esporte e data do dia (em português do Brasil)
- Grade responsiva de imagens (2 colunas mobile → 4 colunas desktop)
- Label com nome da imagem abaixo de cada thumbnail
- Lightbox: ampliar imagem em overlay, navegar com setas e teclado, fechar com ESC
- Contador de imagens no lightbox (ex.: "3 / 12")
- Deploy no Vercel (CI/CD automático via GitHub)
- Leitura dinâmica da pasta `public/selos/`

### Não inclui (V1)
- Upload de imagens via interface
- Autenticação / login
- Menu de navegação
- Busca ou filtros
- Múltiplas datas / histórico
- Comentários ou anotações

---

## Entregáveis
1. **Documentação:** briefing, PRD e spec técnica (pasta `doc/`)
2. **Codebase:** projeto Next.js 15 + TypeScript + Tailwind CSS
3. **Deploy:** URL pública no Vercel
4. **Assets:** logo e selos integrados ao projeto

---

## Cronograma Estimado
| Fase                           | Duração   |
|--------------------------------|-----------|
| Scaffold + config              | 1h        |
| Componentes Gallery + Lightbox | 2h        |
| Integração de assets           | 30min     |
| Testes locais                  | 30min     |
| Deploy Vercel                  | 30min     |
| **Total estimado**             | **4,5h**  |

---

## Stack Técnica
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS v3
- **Runtime:** Node.js 18+
- **Hospedagem:** Vercel
- **Versionamento:** Git / GitHub
