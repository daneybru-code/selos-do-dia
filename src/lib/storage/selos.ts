// Helpers compartilhados pelas rotas de API de selos (upload/delete/images).
// Bucket público no Supabase Storage que substitui o Vercel Blob.
export const SELOS_BUCKET = 'selos';

// A API do Supabase Storage rejeita chaves com acentos/unicode (ex.: "ã",
// "é", "–") com 400 InvalidKey. `filename`/`name` na tabela continuam com o
// nome original (bonito, com acentos) para exibição — só a `storage_path`
// (chave dentro do bucket) precisa ser ASCII-safe.
export function toStoragePath(filename: string, unique?: string): string {
  const dot = filename.lastIndexOf('.');
  const ext = (dot === -1 ? '' : filename.slice(dot)).toLowerCase();
  const base = dot === -1 ? filename : filename.slice(0, dot);
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const suffix = unique ? `-${unique}` : '';
  return `${slug || 'selo'}${suffix}${ext}`;
}
