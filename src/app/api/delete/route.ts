import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { SELOS_BUCKET } from '@/lib/storage/selos';

// Contrato mudou de { urls | url } (URLs públicas do Vercel Blob) para
// { filenames | filename } — o `filename` já é o identificador estável que
// o admin/galeria usam para anotações (`image.filename`), então evita ter
// que reconstruir a `storage_path` a partir da URL pública do Supabase.
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response ?? NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const filenames: string[] = body.filenames ?? (body.filename ? [body.filename] : []);
  if (!filenames.length) {
    return NextResponse.json({ error: 'filename não informado' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: rows, error: selectError } = await supabase
    .from('selos')
    .select('storage_path')
    .in('filename', filenames);

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const storagePaths = (rows ?? []).map((r) => r.storage_path);

  if (storagePaths.length) {
    const { error: removeError } = await supabase.storage.from(SELOS_BUCKET).remove(storagePaths);
    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase.from('selos').delete().in('filename', filenames);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
