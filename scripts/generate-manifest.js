const fs = require('fs');
const path = require('path');

const selosDir = path.join(__dirname, '..', 'public', 'selos');
const manifestPath = path.join(selosDir, 'manifest.json');

// Garante que a pasta existe
if (!fs.existsSync(selosDir)) {
  fs.mkdirSync(selosDir, { recursive: true });
  console.log('📁 Pasta public/selos/ criada');
}

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const files = fs
  .readdirSync(selosDir)
  .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()));

const manifest = {
  generated: new Date().toISOString(),
  total: files.length,
  images: files.map((file) => ({
    filename: file,
    name: path.basename(file, path.extname(file)),
    src: `/selos/${encodeURIComponent(file)}`,
  })),
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✅ Manifest gerado: ${manifest.total} imagem(ns) em public/selos/`);
