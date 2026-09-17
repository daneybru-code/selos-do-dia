import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client Supabase com a service role key: bypassa RLS inteiramente (lê e
// escreve em qualquer tabela, e dá acesso à Admin API de auth — convidar,
// listar, promover, remover usuários). Só deve ser usado em Route Handlers
// protegidos por `requireAdmin()`.
//
// NUNCA importar isso de um arquivo 'use client' — bypassa RLS inteiramente.
// O `import 'server-only'` acima faz o build falhar em vez de vazar a
// service role key silenciosamente se isso acontecer por engano.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
