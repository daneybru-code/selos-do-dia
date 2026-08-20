import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { order } = await request.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order deve ser um array' }, { status: 400 });
  }

  await put('selos/_order.json', JSON.stringify(order), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  revalidateTag('selos-images');
  return NextResponse.json({ success: true });
}
