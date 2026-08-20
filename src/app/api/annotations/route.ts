import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { unstable_cache, revalidateTag } from 'next/cache';
import { Annotations } from '@/types';

const BLOB_PREFIX = 'selos/_annotations';

/* ── Helpers ── */

// Nome fixo + allowOverwrite: evita list()+del() extras a cada gravação
// (antes eram 3 Blob Advanced Operations por escrita; agora é 1).
async function writeAnnotations(data: Annotations): Promise<void> {
  await put(`${BLOB_PREFIX}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  revalidateTag('annotations');
}

// Cacheado por 30s e invalidado na hora após cada escrita: evita gastar
// Blob Advanced Operations (list()) a cada carregamento da galeria/admin.
const readAnnotationsCached = unstable_cache(
  async (): Promise<Annotations> => {
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      const blob = blobs.find((b) => b.pathname === `${BLOB_PREFIX}.json`);
      if (!blob) return {};
      const res = await fetch(blob.url, { cache: 'no-store' });
      return await res.json();
    } catch { return {}; }
  },
  ['annotations'],
  { revalidate: 30, tags: ['annotations'] }
);

async function readAnnotations(): Promise<Annotations> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return {};
  return readAnnotationsCached();
}

/* ── Handlers ── */

export async function GET() {
  const annotations = await readAnnotations();
  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ ok: true });

  const { filename, approved, rejected, note } = await request.json() as {
    filename: string;
    approved: boolean;
    rejected: boolean;
    note: string;
  };

  const current = await readAnnotations();
  await writeAnnotations({
    ...current,
    [filename]: {
      approved: Boolean(approved),
      rejected: Boolean(rejected),
      note: String(note ?? ''),
    },
  });

  return NextResponse.json({ ok: true });
}

// Chamado pelo upload: limpa TODAS as anotações (novo lote = dia novo)
export async function DELETE() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ ok: true });

  // Escreve {} diretamente — sem ler estado anterior (evita cache stale)
  await writeAnnotations({});

  return NextResponse.json({ ok: true });
}
