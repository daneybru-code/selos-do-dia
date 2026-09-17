import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Annotations } from '@/types';

// Sem checagem de admin de propósito: qualquer usuário autenticado pode
// aprovar/rejeitar/anotar (isso já era assim com o Vercel Blob) — a
// proteção de "só quem está logado chega aqui" é feita no proxy
// compartilhado, não nesta rota.

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('selos')
    .select('filename, approved, rejected, note');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const annotations: Annotations = {};
  for (const row of data ?? []) {
    annotations[row.filename] = {
      approved: row.approved,
      rejected: row.rejected,
      note: row.note ?? '',
    };
  }

  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest) {
  const { filename, approved, rejected, note } = (await request.json()) as {
    filename: string;
    approved: boolean;
    rejected: boolean;
    note: string;
  };

  if (!filename) {
    return NextResponse.json({ error: 'filename não informado' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('selos')
    .update({
      approved: Boolean(approved),
      rejected: Boolean(rejected),
      note: String(note ?? ''),
    })
    .eq('filename', filename);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Limpa todas as anotações (chamado pelo upload em versões anteriores: novo
// lote = dia novo). Mantido por compatibilidade, agora como UPDATE em massa
// em vez de reescrever um blob JSON.
export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase
    .from('selos')
    .update({ approved: false, rejected: false, note: '' })
    .not('id', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
