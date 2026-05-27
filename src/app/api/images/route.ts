import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function GET() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: 'selos/' });

      const orderBlob = blobs.find((b) => b.pathname === 'selos/_order.json');
      const imageBlobs = blobs.filter((b) => b.pathname !== 'selos/_order.json');

      let order: string[] | null = null;
      if (orderBlob) {
        try {
          const res = await fetch(orderBlob.url, { cache: 'no-store' });
          order = await res.json();
        } catch { /* ignore */ }
      }

      const images = imageBlobs.map((blob) => ({
        filename: blob.pathname.replace('selos/', ''),
        name: blob.pathname.replace('selos/', '').replace(/\.[^.]+$/, ''),
        src: blob.url,
        _uploadedAt: blob.uploadedAt,
      }));

      if (order && order.length > 0) {
        images.sort((a, b) => {
          const ai = order!.indexOf(a.src);
          const bi = order!.indexOf(b.src);
          if (ai === -1 && bi === -1) return new Date(b._uploadedAt).getTime() - new Date(a._uploadedAt).getTime();
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
      } else {
        images.sort((a, b) => new Date(b._uploadedAt).getTime() - new Date(a._uploadedAt).getTime());
      }

      return NextResponse.json({
        images: images.map(({ _uploadedAt: _, ...rest }) => rest),
      });
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
