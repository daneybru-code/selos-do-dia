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
