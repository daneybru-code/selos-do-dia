import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { SELOS_BUCKET, toStoragePath } from '@/lib/storage/selos';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response ?? NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const validFiles = files.filter((f) => imageTypes.includes(f.type));

  if (!validFiles.length) {
    return NextResponse.json({ error: 'Nenhuma imagem válida' }, { status: 400 });
  }

  const supabase = await createClient();

  // Próxima posição livre = maior posição atual + 1 (novos selos vão pro
  // final da ordem; nulls (nunca reordenados manualmente) não contam).
  const { data: maxRow } = await supabase
    .from('selos')
    .select('position')
    .order('position', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  let nextPosition = (maxRow?.position ?? -1) + 1;

  const uploaded: { url: string; pathname: string }[] = [];
  const errors: string[] = [];

  for (const file of validFiles) {
    const storagePath = toStoragePath(file.name);
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(SELOS_BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const name = file.name.replace(/\.[^.]+$/, '');

    // Reenviar um arquivo com o mesmo nome (mesma storage_path sanitizada)
    // substitui a linha existente em vez de duplicar — mesmo comportamento
    // de "allowOverwrite" que existia com o Vercel Blob.
    const { data: existing } = await supabase
      .from('selos')
      .select('id')
      .eq('storage_path', storagePath)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('selos')
        .update({ filename: file.name, name, uploaded_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) {
        errors.push(`${file.name}: ${updateError.message}`);
        continue;
      }
    } else {
      const { error: insertError } = await supabase.from('selos').insert({
        filename: file.name,
        name,
        storage_path: storagePath,
        position: nextPosition++,
      });
      if (insertError) {
        errors.push(`${file.name}: ${insertError.message}`);
        continue;
      }
    }

    const { data: publicUrl } = supabase.storage.from(SELOS_BUCKET).getPublicUrl(storagePath);
    uploaded.push({ url: publicUrl.publicUrl, pathname: storagePath });
  }

  if (!uploaded.length) {
    return NextResponse.json({ error: errors.join('; ') || 'Falha no envio' }, { status: 500 });
  }

  return NextResponse.json({ uploaded, ...(errors.length ? { errors } : {}) });
}
