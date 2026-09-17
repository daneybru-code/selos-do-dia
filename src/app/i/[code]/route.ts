import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Rota pública de redirect do link curto de convite (ver POST /api/members).
// Usa o client admin (bypassa RLS) porque quem clica ainda não tem sessão
// nenhuma — é exatamente esse o caso de uso. Precisa estar em PUBLIC_PATHS
// no proxy (src/lib/supabase/proxy.ts), senão o middleware redireciona pro
// /login antes desta rota rodar.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from('invite_short_links')
    .select('target_url')
    .eq('code', code)
    .maybeSingle();

  if (!data) {
    return NextResponse.redirect(
      new URL('/login?message=' + encodeURIComponent('Link de convite inválido ou expirado.'), request.url),
    );
  }

  return NextResponse.redirect(data.target_url);
}
