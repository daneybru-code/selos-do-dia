import { randomUUID } from 'node:crypto';
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

  // `generateLink` cria o usuário (mesmo trigger `handle_new_user` populando
  // `profiles`) e devolve, entre outras coisas, um `hashed_token` — sem
  // depender de SMTP/envio de e-mail. O admin copia o link e manda pra
  // pessoa manualmente (WhatsApp, Slack etc.). Ver teste manual documentado
  // no commit: convidar o mesmo e-mail de novo (ainda não confirmado) gera
  // um novo link válido para o mesmo usuário, em vez de dar erro.
  //
  // IMPORTANTE: NÃO use `data.properties.action_link` — esse link passa
  // primeiro pelo domínio do próprio Supabase (`.../auth/v1/verify?...`),
  // que verifica o token e só then redireciona pro nosso app usando o fluxo
  // implícito (tokens de sessão anexados como fragment `#access_token=...`
  // na URL, não como query string) — algo que nossa rota `/auth/confirm`
  // (que espera `token_hash`/`type` como query params) não consegue ler, e
  // que na prática caiu de volta pro Site URL (localhost) em vez do
  // `redirect_to` configurado. Construímos o link direto pro nosso próprio
  // domínio com `token_hash`, pulando o hop pelo domínio do Supabase.
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${origin}/auth/confirm?next=/definir-senha` },
  });

  if (error) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      return NextResponse.json({ error: 'Este e-mail já tem uma conta' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userId = data.user.id;
  const actionLink = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/definir-senha`;

  // Encurta o link do Supabase (gigante, com token na query string) num
  // código curto próprio, resolvido pela rota pública GET /i/[code]. Chance
  // de colisão é baixíssima pro volume de uso daqui (poucos convites), mas
  // confere e tenta de novo antes de desistir.
  let shortCode: string | null = null;
  for (let attempt = 0; attempt < 5 && !shortCode; attempt++) {
    const candidate = randomUUID().replace(/-/g, '').slice(0, 8);
    const { data: existing } = await adminClient
      .from('invite_short_links')
      .select('code')
      .eq('code', candidate)
      .maybeSingle();
    if (!existing) shortCode = candidate;
  }

  let inviteLink = actionLink;
  if (shortCode) {
    const { error: shortLinkError } = await adminClient
      .from('invite_short_links')
      .insert({ code: shortCode, target_url: actionLink });

    if (!shortLinkError) {
      inviteLink = `${origin}/i/${shortCode}`;
    }
    // Se der erro ao salvar o link curto, cai de volta pro link longo do
    // Supabase — não vale falhar o convite inteiro por causa disso.
  }

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

  return NextResponse.json({ ok: true, userId, inviteLink });
}
