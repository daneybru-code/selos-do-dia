import { head, put } from '@vercel/blob';
import { ImageData } from '@/types';

// Guarda a lista de selos num único blob de caminho fixo (selos/_index.json).
// Ler esse índice custa 1 Simple Operation (head) em vez de 1 Advanced Operation
// (list). list()/put()/copy() contam para a cota de 2.000 Advanced Operations/mês
// do Hobby; head() conta para a cota de 10.000 Simple Operations — bem mais folgada.
const INDEX_PATH = 'selos/_index.json';
const ORDER_PATH = 'selos/_order.json';

async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  try {
    const info = await head(pathname);
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function readImageIndex(): Promise<ImageData[]> {
  return (await readJsonBlob<ImageData[]>(INDEX_PATH)) ?? [];
}

// Só é chamada por rotas de admin (upload/delete), que são raras — o custo em
// Advanced Operations aqui é aceitável porque não escala com o tráfego público.
export async function writeImageIndex(images: ImageData[]): Promise<void> {
  await put(INDEX_PATH, JSON.stringify(images), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readOrder(): Promise<string[] | null> {
  return readJsonBlob<string[]>(ORDER_PATH);
}
