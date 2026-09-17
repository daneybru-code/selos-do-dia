import { NextRequest, NextResponse } from 'next/server';
import { head, put } from '@vercel/blob';
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
  revalidateTag('annotations', { expire: 0 });
}

// Cacheado e invalidado na hora após cada escrita: usa head() (Simple
// Operation) em vez de list() (Advanced Operation) — não consome a cota de
// 2.000 Advanced Operations/mês do Hobby a cada carregamento da galeria/admin.
const readAnnotationsCached = unstable_cache(
  async (): Promise<Annotations> => {
    try {
      const info = await head(`${BLOB_PREFIX}.json`);
      const res = await fetch(info.url, { cache: 'no-store' });
      if (!res.ok) return {};
      return await res.json();
    } catch { return {}; }
  },
  ['annotations'],
  { revalidate: 300, tags: ['annotations'] }
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
