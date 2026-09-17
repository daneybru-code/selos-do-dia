import { NextResponse } from 'next/server';

// TODO: será substituído pela frente de auth (Supabase Auth + papéis em
// `public.profiles`), que roda em paralelo num worktree separado. Este é um
// STUB TEMPORÁRIO só para as rotas de API da Fase 3b (Storage/dados) poderem
// chamar `requireAdmin()` sem travar em quem chegou primeiro no merge. Ele
// sempre autoriza — NÃO faz nenhuma checagem real de sessão/role. Isso deve
// ser sobrescrito pela implementação real no merge final (Fase 4 do
// TASKS.md); não usar este arquivo como guarda de segurança em produção.
export interface RequireAdminResult {
  ok: boolean;
  userId?: string;
  response?: NextResponse;
}

export async function requireAdmin(): Promise<RequireAdminResult> {
  return { ok: true, userId: 'stub' };
}
