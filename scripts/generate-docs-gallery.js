/**
 * Gera a galeria estática somente-leitura em /docs, hospedada de graça no
 * GitHub Pages, para uso temporário enquanto a cota "Advanced Operations"
 * do Vercel Blob (plano Hobby) estiver esgotada no ciclo atual.
 *
 * O que faz:
 *   1. Lê public/selos/manifest.json (gerado por scripts/generate-manifest.js)
 *   2. Copia todas as imagens de public/selos/ para docs/selos/
 *   3. Copia public/logo.png para docs/logo.png (se existir)
 *   4. Gera docs/index.html — galeria estática, sem build, sem dependências externas
 *   5. Cria docs/.nojekyll para o GitHub Pages não rodar o Jekyll
 *
 * Idempotente: pode ser rodado quantas vezes forem necessárias para atualizar
 * a galeria estática depois de adicionar novas imagens em public/selos/.
 *
 * Uso:
 *   node scripts/generate-manifest.js        # garante que o manifest está atualizado
 *   node scripts/generate-docs-gallery.js    # gera/atualiza /docs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const selosDir = path.join(ROOT, 'public', 'selos');
const manifestPath = path.join(selosDir, 'manifest.json');
const logoSrc = path.join(ROOT, 'public', 'logo.png');

const docsDir = path.join(ROOT, 'docs');
const docsSelosDir = path.join(docsDir, 'selos');
const docsLogoDest = path.join(docsDir, 'logo.png');
const docsIndexPath = path.join(docsDir, 'index.html');
const docsNojekyllPath = path.join(docsDir, '.nojekyll');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ public/selos/manifest.json não encontrado. Rode "node scripts/generate-manifest.js" primeiro.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const images = Array.isArray(manifest.images) ? manifest.images : [];

  // Garante pastas de destino
  fs.mkdirSync(docsSelosDir, { recursive: true });

  // Copia as imagens (sobrescrevendo)
  let copied = 0;
  for (const img of images) {
    const from = path.join(selosDir, img.filename);
    const to = path.join(docsSelosDir, img.filename);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
      copied += 1;
    } else {
      console.warn(`⚠️  Arquivo listado no manifest não encontrado: ${img.filename}`);
    }
  }

  // Remove da docs/selos qualquer imagem que não esteja mais no manifest
  const validFilenames = new Set(images.map((i) => i.filename));
  const existingDocsFiles = fs.readdirSync(docsSelosDir);
  for (const f of existingDocsFiles) {
    if (f === '.gitkeep') continue;
    if (!validFilenames.has(f)) {
      fs.unlinkSync(path.join(docsSelosDir, f));
    }
  }

  // Copia o logo, se existir
  if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, docsLogoDest);
  }

  // Gera o HTML
  const html = buildHtml(images);
  fs.writeFileSync(docsIndexPath, html, 'utf8');

  // .nojekyll
  fs.writeFileSync(docsNojekyllPath, '', 'utf8');

  console.log(`✅ Galeria estática gerada em /docs (${copied} imagem(ns) copiada(s))`);
  console.log('   → docs/index.html');
  console.log('   → docs/selos/*');
  console.log('   → docs/.nojekyll');
}

function buildHtml(images) {
  const hasLogo = fs.existsSync(logoSrc);
  const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const cards = images
    .map((img, i) => {
      const src = `selos/${encodeURIComponent(img.filename)}`;
      const name = escapeHtml(img.name);
      return `
        <a class="card" href="${src}" target="_blank" rel="noopener" data-index="${i}" data-src="${src}" data-name="${name}" onclick="return openLightbox(event, ${i})">
          <div class="card-img-wrap">
            <img src="${src}" alt="${name}" loading="lazy" />
          </div>
          <p class="card-label">${name}</p>
        </a>`;
    })
    .join('\n');

  const emptyState = `
        <div class="empty-state">
          <div class="empty-icon">🖼️</div>
          <p class="empty-title">Nenhum selo disponível no momento</p>
          <p class="empty-sub">Assim que novos selos forem publicados, eles aparecerão aqui.</p>
        </div>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Selos do Dia — Galeria Temporária</title>
<meta name="description" content="Galeria pública temporária (somente leitura) dos selos do dia, enquanto o armazenamento principal está indisponível." />
<meta name="robots" content="noindex" />
<style>
  :root {
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0D0D0D;
    color: #eee;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    min-height: 100vh;
  }
  header {
    background: linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%);
    padding: 2rem 1rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
  }
  header img.logo {
    width: 56px;
    height: 56px;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  }
  header h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  header p.subtitle {
    margin: 0;
    color: rgba(255,255,255,0.92);
    font-size: 0.9rem;
    max-width: 640px;
    line-height: 1.5;
  }
  header p.subtitle strong {
    font-weight: 700;
  }
  .banner {
    max-width: 900px;
    margin: 1rem auto 0;
    padding: 0.6rem 1rem;
    background: rgba(255, 194, 0, 0.08);
    border: 1px solid rgba(255, 194, 0, 0.3);
    border-radius: 10px;
    color: #FFC200;
    font-size: 0.8rem;
    text-align: center;
    line-height: 1.5;
  }
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
  @media (min-width: 640px) {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (min-width: 1024px) {
    .grid { grid-template-columns: repeat(4, 1fr); }
  }
  .card {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
  }
  .card-img-wrap {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 12px;
    background: #1A1A1A;
    border: 2px solid transparent;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .card:hover .card-img-wrap {
    border-color: #FF6600;
    box-shadow: 0 0 22px rgba(255,102,0,0.35);
  }
  .card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    display: block;
  }
  .card:hover .card-img-wrap img {
    transform: scale(1.05);
  }
  .card-label {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
    color: #FFD700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 0.25rem;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 5rem 1rem;
    text-align: center;
  }
  .empty-icon { font-size: 2.5rem; opacity: 0.7; }
  .empty-title { font-weight: 700; font-size: 1.1rem; color: #888; margin: 0; }
  .empty-sub { font-size: 0.9rem; color: #555; max-width: 320px; margin: 0; line-height: 1.5; }

  dialog#lightbox {
    border: none;
    background: transparent;
    max-width: 96vw;
    max-height: 92vh;
    padding: 0;
  }
  dialog#lightbox::backdrop {
    background: rgba(0,0,0,0.85);
  }
  dialog#lightbox .lightbox-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  dialog#lightbox img {
    max-width: 96vw;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
  }
  dialog#lightbox p {
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    margin: 0;
    text-align: center;
  }
  dialog#lightbox button.close-btn {
    align-self: flex-end;
    background: rgba(255,255,255,0.1);
    border: none;
    color: #fff;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    font-size: 1.1rem;
    cursor: pointer;
    line-height: 1;
  }
  dialog#lightbox button.close-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  footer {
    text-align: center;
    padding: 2rem 1rem;
    font-size: 0.8rem;
    color: #444;
  }
</style>
</head>
<body>

  <header>
    ${hasLogo ? '<img class="logo" src="logo.png" alt="Logo" />' : ''}
    <h1>Selos do Dia</h1>
    <p class="subtitle">
      Espelho público <strong>temporário e somente leitura</strong> da galeria de selos,
      hospedado de graça no GitHub Pages.
    </p>
  </header>

  <div class="banner">
    ⚠️ Este é um espelho estático temporário. Ele não recebe novas imagens automaticamente nem
    permite ações administrativas (aprovar / rejeitar / excluir / reordenar). O painel completo
    volta ao normal assim que a cota do armazenamento principal for renovada.
  </div>

  <main>
    ${images.length === 0 ? emptyState : `<div class="grid">${cards}</div>`}
  </main>

  <footer>Globo Esporte · Selos do Dia · gerado em ${generatedAt}</footer>

  <dialog id="lightbox">
    <div class="lightbox-inner">
      <button class="close-btn" onclick="closeLightbox()" aria-label="Fechar">✕</button>
      <img id="lightbox-img" src="" alt="" />
      <p id="lightbox-name"></p>
    </div>
  </dialog>

  <script>
    var dialog = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxName = document.getElementById('lightbox-name');

    function openLightbox(evt, index) {
      if (!dialog || typeof dialog.showModal !== 'function') {
        // Sem suporte a <dialog>: deixa o link padrão abrir a imagem em nova aba.
        return true;
      }
      evt.preventDefault();
      var card = evt.currentTarget;
      lightboxImg.src = card.getAttribute('data-src');
      lightboxImg.alt = card.getAttribute('data-name');
      lightboxName.textContent = card.getAttribute('data-name');
      dialog.showModal();
      return false;
    }

    function closeLightbox() {
      dialog.close();
    }

    if (dialog) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
      });
    }
  </script>

</body>
</html>
`;
}

main();
