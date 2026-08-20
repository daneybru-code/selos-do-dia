import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

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

  await del(urls);
  revalidateTag('selos-images');
  return NextResponse.json({ success: true });
}
