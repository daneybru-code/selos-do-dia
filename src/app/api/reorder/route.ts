import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

// Contrato mudou de { order: string[] } com URLs públicas (Vercel Blob) para
// { order: string[] } com `filename` — identificador estável já usado pelo
// admin/galeria para anotações. Cada posição na array vira a coluna
// `position` da linha correspondente (substitui o antigo blob _order.json).
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response ?? NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { order } = await request.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order deve ser um array' }, { status: 400 });
  }

  const supabase = await createClient();

  const results = await Promise.all(
    order.map((filename: string, index: number) =>
      supabase.from('selos').update({ position: index }).eq('filename', filename)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
