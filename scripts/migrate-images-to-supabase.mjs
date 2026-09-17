// Migra as imagens existentes em public/selos/ (Vercel Blob → fallback local)
// para o Supabase Storage (bucket "selos") + tabela public.selos.
//
// Rodar uma única vez, manualmente, depois que a migration
// supabase/migrations/<...>_create_selos.sql já tiver sido aplicada
// (bucket "selos" e tabela public.selos precisam existir):
//
//   node scripts/migrate-images-to-supabase.mjs
//
// Lê as credenciais de .env.local (SUPABASE_SERVICE_ROLE_KEY é necessária
// porque a policy de insert/update na tabela e no bucket exige um usuário
// autenticado — a service role bypassa RLS).

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { extname, basename, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

// Carrega .env.local manualmente (sem dependência extra tipo dotenv).
function loadEnvLocal() {
  const envPath = join(rootDir, '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = 'selos';
const selosDir = join(rootDir, 'public', 'selos');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const contentTypeByExt = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

// A API do Supabase Storage rejeita chaves com acentos/caracteres unicode
// (ex.: "ã", "é", "–") com 400 InvalidKey. `filename`/`name` na tabela
// continuam com o nome original (bonito, com acentos) para exibição — só a
// `storage_path` (chave dentro do bucket) precisa ser ASCII-safe.
function toStoragePath(filename) {
  const ext = extname(filename).toLowerCase();
  const base = basename(filename, extname(filename));
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${slug || 'selo'}${ext}`;
}

async function main() {
  const files = readdirSync(selosDir).filter((f) =>
    imageExtensions.includes(extname(f).toLowerCase())
  );

  if (!files.length) {
    console.log('Nenhuma imagem encontrada em public/selos/. Nada a migrar.');
    return;
  }

  console.log(`Encontradas ${files.length} imagem(ns) em public/selos/:`);
  files.forEach((f) => console.log(`  - ${f}`));

  let position = 0;
  for (const filename of files) {
    const filePath = join(selosDir, filename);
    const buffer = readFileSync(filePath);
    const uploadedAt = statSync(filePath).mtime.toISOString();
    const name = basename(filename, extname(filename));
    const storagePath = toStoragePath(filename);
    const contentType = contentTypeByExt[extname(filename).toLowerCase()] ?? 'application/octet-stream';

    process.stdout.write(`Enviando "${filename}" para o bucket "${BUCKET}"... `);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      console.log('ERRO');
      console.error(uploadError);
      process.exitCode = 1;
      continue;
    }
    console.log('ok');

    process.stdout.write(`Inserindo linha na tabela "selos" para "${filename}"... `);
    const { error: insertError } = await supabase
      .from('selos')
      .upsert(
        {
          filename,
          name,
          storage_path: storagePath,
          uploaded_at: uploadedAt,
          position: position++,
        },
        { onConflict: 'storage_path' }
      );

    if (insertError) {
      console.log('ERRO');
      console.error(insertError);
      process.exitCode = 1;
      continue;
    }
    console.log('ok');
  }

  const { count, error: countError } = await supabase
    .from('selos')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Falha ao contar linhas em selos:', countError);
    process.exitCode = 1;
    return;
  }

  console.log(`\nConcluído. Total de linhas em public.selos: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
