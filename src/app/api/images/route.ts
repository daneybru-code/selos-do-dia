import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Produção: lê do Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: 'selos/' });
      const images = blobs
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .map((blob) => ({
          filename: blob.pathname.replace('selos/', ''),
          name: blob.pathname.replace('selos/', '').replace(/\.[^.]+$/, ''),
          src: blob.url,
        }));
      return NextResponse.json({ images });
    } catch {
      return NextResponse.json({ images: [] });
    }
  }

  // Dev local: lê da pasta public/selos/
  try {
    const selosDir = path.join(process.cwd(), 'public', 'selos');
    if (!fs.existsSync(selosDir)) return NextResponse.json({ images: [] });
    const files = fs.readdirSync(selosDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files
      .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
      .map((file) => ({
        filename: file,
        name: path.basename(file, path.extname(file)),
        src: `/selos/${encodeURIComponent(file)}`,
      }));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
