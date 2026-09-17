import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['admin', 'viewer'] as const;
type Role = (typeof ROLES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

// GET: lista todos os membros (profiles). Precisa da service role porque a
// RLS de `profiles` só permite `select` do próprio registro (auth.uid() = id)
// — listar todo mundo bypassa RLS de propósito, daí a checagem de admin.
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}

// POST: convida um novo membro por email, com o papel já definido.
export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const body = (await request.json().catch(() => null)) as { email?: string; role?: string } | null;
  const email = body?.email?.trim();
  const role = body?.role;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "Papel deve ser 'admin' ou 'viewer'" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/definir-senha`,
  });

  if (error) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      return NextResponse.json({ error: 'Este e-mail já tem uma conta' }, { status: 409 });
    }
    // Limite de envio de e-mail do Supabase (baixo por padrão no plano
    // gratuito) — confirmado durante teste manual desta rota: convidar o
    // mesmo endereço duas vezes em poucos segundos já é suficiente para
    // disparar esse erro antes mesmo da checagem de "já existe".
    if (error.code === 'over_email_send_rate_limit') {
      return NextResponse.json(
        { error: 'Muitos convites enviados em pouco tempo. Aguarde alguns minutos e tente de novo.' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userId = data.user.id;

  // O trigger `handle_new_user` já criou a linha em `profiles` com
  // role = 'viewer' por padrão — só precisa promover se o convite pedido
  // for de admin.
  if (role === 'admin') {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, userId });
}
