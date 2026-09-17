import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Rota que recebe o link do convite/redefinição de senha (enviado pelo
// Supabase Auth) e troca o token pela sessão do usuário. Precisa ser
// pública (ver PUBLIC_PATHS em src/lib/supabase/proxy.ts) porque quem
// clica no link ainda não tem sessão nenhuma.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/definir-senha';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      redirect(next);
    }
  }

  redirect(`/login?message=${encodeURIComponent('Link de convite inválido ou expirado.')}`);
}
