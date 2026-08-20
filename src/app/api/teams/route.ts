import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHAMPIONSHIPS = ['serie-a', 'serie-b', 'serie-c', 'copa-nordeste'];
const IMG_EXT = /\.(png|jpg|jpeg|webp|svg)$/i;

function formatName(filename: string) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export async function GET() {
  const result: Record<string, { name: string; path: string }[]> = {};

  for (const champ of CHAMPIONSHIPS) {
    const dir = path.join(process.cwd(), 'public', 'times', champ);
    try {
      if (!fs.existsSync(dir)) { result[champ] = []; continue; }
      result[champ] = fs
        .readdirSync(dir)
        .filter((f) => IMG_EXT.test(f) && !f.startsWith('.'))
        .map((f) => ({ name: formatName(f), path: `/times/${champ}/${encodeURIComponent(f)}` }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } catch {
      result[champ] = [];
    }
  }

  return NextResponse.json(result);
}
