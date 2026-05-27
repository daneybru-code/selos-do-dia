# Spec Técnica — Selos do Dia | Globo Esporte

**Versão:** 1.0  
**Data:** 2026-05-27  
**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Vercel

---

## 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                  VERCEL (Edge Network)                   │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │ Static Files │    │  Next.js Server (Lambda)      │  │
│  │ /public/*    │    │                               │  │
│  │  logo.png    │    │  GET /  →  page.tsx           │  │
│  │  /selos/*.png│    │  (Server Component)           │  │
│  └──────────────┘    │  → fs.readdirSync(public/selos│  │
│                      │  → passa ImageData[] ao client │  │
│                      └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Pastas

```
selos do dia/                    ← raiz do projeto (working directory)
├── doc/
│   ├── briefing.md
│   ├── prd.md
│   └── spec.md
├── public/
│   ├── logo.png                 ← cópia de IMAGENS/LOGO GE 2021.png
│   └── selos/                   ← cópia das imagens de SELOS DO DIA/
│       ├── DUET POSTAGEM YAGO.png
│       ├── SELO CRISTIANO RONALDO.png
│       ├── selo figurinhas.jpeg
│       ├── SELO RETROSPECTO ATAQUE.png
│       ├── SELO SANTA X FERROVIARIA DOMINGO.png
│       └── SELO SPORT X NAUTICO SÁBADO 26.05.png
├── scripts/
│   └── generate-manifest.js     ← gera manifest.json com lista de imagens
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← root layout (metadata, html/body)
│   │   ├── page.tsx             ← Server Component: lê fs, renderiza galeria
│   │   └── globals.css          ← Tailwind + reset + scrollbar
│   └── components/
│       ├── Gallery.tsx          ← Client Component: grid + estado lightbox
│       └── Lightbox.tsx         ← Client Component: overlay + navegação + filmstrip
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 3. Fluxo de Dados

```
Build/Request Time:
  page.tsx (Server Component)
    └─ fs.readdirSync('public/selos/')
         └─ filtra por extensão de imagem
              └─ monta ImageData[]
                   └─ <Gallery images={ImageData[]} />

Runtime (Client):
  Gallery.tsx
    └─ grid de <article> clicáveis
         └─ onClick → setSelectedIndex(i)
              └─ <Lightbox currentIndex={i} />
                   ├─ ESC → onClose()
                   ├─ ArrowLeft → onNavigate(i-1)
                   ├─ ArrowRight → onNavigate(i+1)
                   └─ click fora → onClose()
```

---

## 4. Tipos e Interfaces

```typescript
// Exportado de src/app/page.tsx
// Compartilhado com Gallery.tsx e Lightbox.tsx
export interface ImageData {
  filename: string;  // "SELO SPORT X NAUTICO SÁBADO 26.05.png"
  name: string;      // "SELO SPORT X NAUTICO SÁBADO 26.05"
  src: string;       // "/selos/SELO%20SPORT%20X%20NAUTICO%20S%C3%81BADO%2026.05.png"
}
```

---

## 5. Componentes

### 5.1 `src/app/page.tsx` — Server Component

**Responsabilidades:**
- Ler `public/selos/` via `fs.readdirSync`
- Filtrar por extensões: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Formatar data em `pt-BR` (weekday long + day + month long + year)
- Renderizar: `<header>` com logo + título + data + contador; `<Gallery>`; `<footer>`

**Não possui estado.** Executa no servidor.

---

### 5.2 `src/components/Gallery.tsx` — Client Component (`'use client'`)

**Props:** `{ images: ImageData[] }`  
**Estado:** `selectedIndex: number | null`

**Layout:**
```
grid-cols-2          (< 640px — mobile)
sm:grid-cols-3       (≥ 640px — tablet)
lg:grid-cols-4       (≥ 1024px — desktop)
gap-5
```

**Comportamento por card:**
- `aspect-video` (16:9) no thumbnail
- Hover: `border-[#FF6600]` + `box-shadow: 0 0 20px rgba(255,102,0,0.3)` + `scale(1.05)` na imagem
- Overlay escuro com texto "Clique para ampliar" no hover
- Label `color: #FFD700` abaixo do card, truncada com `title` completo

**Estado vazio:** mensagem amigável com emoji e instrução de uso.

---

### 5.3 `src/components/Lightbox.tsx` — Client Component (`'use client'`)

**Props:**
```typescript
{
  images: ImageData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}
```

**Layout:**
```
fixed inset-0 z-50 bg-black/96
  ├─ Barra top: [contador] [nome da imagem em #FFD700] [botão ×]
  ├─ Seta ‹ (left, hidden se primeiro)
  ├─ Seta › (right, hidden se último)
  ├─ Imagem centralizada max-h-[80vh] object-contain
  └─ Filmstrip: miniaturas 48×32px, ativa tem border #FF6600 + scale(1.1)
```

**Keyboard handler (useEffect):**
- `Escape` → `onClose()`
- `ArrowLeft` + hasPrev → `onNavigate(currentIndex - 1)`
- `ArrowRight` + hasNext → `onNavigate(currentIndex + 1)`

**Body overflow:** `hidden` enquanto aberto; restaurado no cleanup.

**Acessibilidade:** `role="dialog"` + `aria-modal="true"` + `aria-label` nos botões.

---

## 6. Design Tokens

### Tailwind Config
```typescript
colors: {
  brand: {
    red:    '#CC0000',
    orange: '#FF6600',
    yellow: '#FFC200',
    gold:   '#F5C518',
    dark:   '#0D0D0D',
    card:   '#1A1A1A',
  }
}
```

### Hierarquia Visual
```
HEADER  gradient(135deg, #CC0000, #FF6600, #FFC200)
  logo.png          h-14 sm:h-18, drop-shadow
  "SELOS DO DIA"    text-3xl font-black uppercase tracking-widest white
  data              text-base capitalize text-white/90
  "N selos"         badge bg-black/20 rounded-full text-sm

BODY  bg-#0D0D0D
  Grid de cards
    Card bg-#1A1A1A rounded-xl
    Thumbnail 16:9 object-cover
    Hover: border-#FF6600 + glow + scale-105
    Label: #FFD700 text-sm font-semibold truncate

LIGHTBOX  bg-black/96
  Nome: #FFD700 text-sm font-bold (topo, centro)
  Contador: white/60 (topo, esquerda)
  Fechar: white/70 text-4xl (topo, direita)
  Setas: white/60 → white text-6xl (laterais)
  Imagem: max-h-80vh rounded-lg shadow-xl
  Filmstrip: 48×32px, ativa borda-#FF6600 scale-1.1
```

---

## 7. Encoding de Filenames

Arquivos com espaços, acentos e caracteres especiais:

```typescript
// Geração do src (page.tsx):
src: `/selos/${encodeURIComponent(file)}`
// "SÁBADO 26.05.png" → "/selos/S%C3%81BADO%2026.05.png"

// Uso no JSX:
<img src={image.src} />  // browser decodifica automaticamente
```

---

## 8. Scripts npm

```json
"scripts": {
  "dev":                "next dev",
  "build":              "node scripts/generate-manifest.js && next build",
  "start":              "next start",
  "lint":               "next lint",
  "generate-manifest":  "node scripts/generate-manifest.js"
}
```

`generate-manifest.js` varre `public/selos/`, gera `public/selos/manifest.json`.  
Útil para debug e para referência futura em SSG puro.

---

## 9. Deploy no Vercel

### Passos (primeira vez)
```bash
# 1. Inicializar git
git init && git add . && git commit -m "feat: initial scaffold selos do dia"

# 2. Criar repositório e push
gh repo create selos-do-dia --public --source=. --push

# 3. Importar no Vercel dashboard
# vercel.com → Add New Project → Import Git Repository
# Framework: Next.js (auto-detectado)
```

### CI/CD (deploys subsequentes)
```bash
# Adicionar novos selos:
# 1. Copiar arquivos para public/selos/
git add public/selos/
git commit -m "chore: adiciona selos de 2026-05-28"
git push
# → Vercel detecta push e faz deploy automático
```

### Variáveis de Ambiente
Nenhuma variável de ambiente necessária na V1.

---

## 10. Performance

| Técnica                    | Implementação                                      |
|----------------------------|----------------------------------------------------|
| Lazy loading               | `loading="lazy"` em todas as `<img>`               |
| Aspect ratio fixo          | `aspect-video` no container (evita layout shift)   |
| Sem webfonts externas      | `font-family: Arial, system-ui` (0 round-trips)    |
| Edge CDN                   | Assets em `public/` entregues pelo Vercel Edge     |
| Client Components mínimos  | Apenas Gallery + Lightbox são `'use client'`       |
| Server Component na raiz   | `page.tsx` executa no servidor (sem JS hidratado)  |

---

## 11. Checklist de QA

- [ ] Todas as imagens aparecem na galeria
- [ ] Nomes com acentos (`SÁBADO`) e espaços exibem corretamente
- [ ] Nomes sem extensão no label (sem `.png`)
- [ ] Lightbox abre ao clicar em qualquer imagem
- [ ] ESC fecha o lightbox
- [ ] Setas navegam (sem loop, sem overflow de índice)
- [ ] Filmstrip destaca a imagem atual com borda laranja
- [ ] Clicar fora da imagem fecha o lightbox
- [ ] Grid responsivo: 320px / 768px / 1024px / 1440px
- [ ] Logo aparece no header sem distorção
- [ ] Data em português do Brasil, capitalizada corretamente
- [ ] Contador "N selos" no header
- [ ] Nenhum erro de console em dev e prod
- [ ] `npm run build` sem erros TypeScript
- [ ] Deploy Vercel: build green, URL pública acessível
