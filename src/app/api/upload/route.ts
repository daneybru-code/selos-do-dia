import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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

  const uploaded = await Promise.all(
    validFiles.map((file) =>
      put(`selos/${file.name}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
    )
  );

  return NextResponse.json({
    uploaded: uploaded.map((b) => ({ url: b.url, pathname: b.pathname })),
  });
}
