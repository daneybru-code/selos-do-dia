import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { readImageIndex, writeImageIndex } from '@/lib/blobIndex';

export async function DELETE(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const urls: string[] = body.urls ?? (body.url ? [body.url] : []);
  if (!urls.length) {
    return NextResponse.json({ error: 'URL não informada' }, { status: 400 });
  }

  // del() não conta como Advanced Operation (é gratuito) — só a atualização
  // do índice abaixo (writeImageIndex) usa 1 Advanced Operation.
  await del(urls);

  const currentIndex = await readImageIndex();
  await writeImageIndex(currentIndex.filter((img) => !urls.includes(img.src)));

  revalidateTag('selos-images', { expire: 0 });
  return NextResponse.json({ success: true });
}
