# Selos do Dia — Globo Esporte

Galeria web para consulta e visualização dos selos gráficos diários do Globo Esporte.

## 🚀 Setup Local

```bash
npm install
npm run dev
```

Acesse: **http://localhost:3000**

## 🖼️ Adicionar Imagens

Copie os arquivos de imagem para `public/selos/`:

```
public/
└── selos/
    ├── SELO JOGO DA NOITE.png
    └── SELO ATLETA.jpg
```

Reinicie o servidor dev (`npm run dev`) para ver as novas imagens.

## 📦 Deploy no Vercel

```bash
# 1. Inicializar git (primeira vez)
git init
git add .
git commit -m "feat: initial scaffold"

# 2. Push para GitHub
gh repo create selos-do-dia --public --source=. --push

# 3. Importar no Vercel
# → vercel.com → Add New Project → Import Git Repository
# → Framework: Next.js (auto-detectado)
```

### Atualizar imagens após deploy

```bash
# Copiar novos selos para public/selos/
git add public/selos/
git commit -m "chore: selos de 2026-05-28"
git push
# → Vercel faz deploy automático
```

## 🎨 Stack

| Tecnologia | Versão  |
|------------|---------|
| Next.js    | 15.3.2  |
| React      | 19      |
| TypeScript | 5       |
| Tailwind   | 3.4     |
| Vercel     | —       |

## 🚧 Atualizando a galeria pública temporária (durante o bloqueio do Vercel Blob)

A cota de **"Advanced Operations"** do Vercel Blob (plano Hobby, 2000/mês) foi esgotada no ciclo
atual de cobrança. Enquanto isso, o site em produção na Vercel **não consegue ler nem gravar
imagens via Blob** (galeria e painel admin ficam indisponíveis). A cota é renovada automaticamente
em ~30 dias, mas para manter um link funcionando com os usuários finais nesse meio tempo, existe
uma **galeria estática, somente leitura, hospedada de graça no GitHub Pages**, na pasta `/docs` da
raiz do repositório — totalmente independente do Vercel Blob.

Essa galeria estática é apenas um "espelho" das imagens que já estão em `public/selos/`. Ela **não
tem** painel admin, aprovação/rejeição, exclusão em lote ou reordenação — é puramente para
visualização pública enquanto o Vercel Blob está bloqueado.

### Como adicionar novos selos enquanto o espelho estiver ativo

```bash
# 1. Copie os novos arquivos de imagem para public/selos/
#    (mesma pasta de sempre)

# 2. Gere/atualize a galeria estática em /docs
node scripts/generate-docs-gallery.js

# 3. Suba as mudanças
git add docs public/selos
git commit -m "chore: atualiza galeria estática temporária"
git push
```

O GitHub Pages faz redeploy automático a partir da pasta `/docs` da branch `main` a cada push —
não é necessária nenhuma ação extra (nenhum GitHub Actions, nenhum build). Em alguns minutos o link
público já reflete as novas imagens.

> `node scripts/generate-docs-gallery.js` é idempotente: pode ser rodado quantas vezes forem
> necessárias, sempre sobrescrevendo `docs/index.html` e `docs/selos/*` com o conteúdo atual de
> `public/selos/`.

### Quando o Vercel Blob voltar ao normal

Nada precisa ser desfeito. O app em `src/` (Next.js + Vercel Blob) continua funcionando exatamente
como antes — essa pasta `/docs` é aditiva e não interfere no build ou no deploy da Vercel. O painel
admin completo (upload, aprovação, exclusão, reordenação) volta a funcionar automaticamente assim
que a cota do Blob for renovada.

## 📁 Estrutura

```
src/
├── app/
│   ├── page.tsx       ← Server Component: lê imagens e renderiza galeria
│   ├── layout.tsx     ← Root layout com metadados
│   └── globals.css    ← Estilos globais + Tailwind
└── components/
    ├── Gallery.tsx    ← Grid responsivo + controle do lightbox
    └── Lightbox.tsx   ← Overlay com imagem ampliada + navegação
```
