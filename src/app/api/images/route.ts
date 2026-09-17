import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { readImageIndex, readOrder } from '@/lib/blobIndex';
import { ImageData } from '@/types';

// Lê o índice de imagens (1 Simple Operation via head(), não Advanced via list()).
// Cacheado por 5min e invalidado na hora por upload/delete/reorder.
const getIndexedImages = unstable_cache(
  async () => readImageIndex(),
  ['selos-index'],
  { revalidate: 300, tags: ['selos-images'] }
);

const getOrderCached = unstable_cache(
  async () => readOrder(),
  ['selos-order'],
  { revalidate: 300, tags: ['selos-images'] }
);

function applyOrder(images: ImageData[], order: string[] | null) {
  if (!order || order.length === 0) {
    return [...images].sort(
      (a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime()
    );
  }
  return [...images].sort((a, b) => {
    const ai = order.indexOf(a.src);
    const bi = order.indexOf(b.src);
    if (ai === -1 && bi === -1) {
      return new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime();
    }
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// Fallback: lê direto de public/selos/ (empacotado no deploy). Usado em dev
// local sempre, e em produção sempre que o índice do Blob ainda não existir
// (ex.: cota de Advanced Operations esgotada e index nunca escrito) — assim a
// galeria pública continua no ar mesmo com o Blob indisponível.
function readLocalImages(): ImageData[] {
  const selosDir = path.join(process.cwd(), 'public', 'selos');
  if (!fs.existsSync(selosDir)) return [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return fs
    .readdirSync(selosDir)
    .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
    .map((file) => ({
      filename: file,
      name: path.basename(file, path.extname(file)),
      src: `/selos/${encodeURIComponent(file)}`,
      uploadedAt: fs.statSync(path.join(selosDir, file)).mtime.toISOString(),
    }));
}

export async function GET() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const [images, order] = await Promise.all([getIndexedImages(), getOrderCached()]);
    if (images.length > 0) {
      return NextResponse.json({ images: applyOrder(images, order) });
    }
    // Índice ainda não existe no Blob (ex.: cota esgotada antes da primeira
    // gravação) — cai para as imagens já publicadas junto com o deploy.
    return NextResponse.json({ images: readLocalImages() });
  }

  return NextResponse.json({ images: readLocalImages() });
}
