import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RequireAdminResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Checagem server-side de permissão de admin para rotas de API (upload,
 * delete, reorder, annotations, etc). Cria o client Supabase a partir dos
 * cookies da requisição, confirma que existe uma sessão autenticada e que
 * o `role` em `public.profiles` para esse usuário é `'admin'`.
 *
 * Uso típico dentro de um Route Handler:
 *
 *   import { requireAdmin } from '@/lib/auth/requireAdmin';
 *
 *   export async function POST(request: Request) {
 *     const check = await requireAdmin();
 *     if (!check.ok) return check.response;
 *
 *     // check.userId disponível daqui pra baixo (id do usuário autenticado)
 *     ...
 *   }
 *
 * Retorna:
 *   - { ok: false, response: 401 } se não houver sessão (usuário não logado)
 *   - { ok: false, response: 403 } se houver sessão mas role !== 'admin'
 *   - { ok: true, userId } se o usuário autenticado for admin
 *
 * Substitui o antigo header `x-admin-password` — não é mais necessário
 * enviar nenhuma senha manualmente; a sessão Supabase (cookies) já basta.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
