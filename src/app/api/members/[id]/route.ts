import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

const ROLES = ['admin', 'viewer'] as const;
type Role = (typeof ROLES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

type RouteContext = { params: Promise<{ id: string }> };

// PATCH: troca o papel de um membro existente.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { id } = await params;

  const body = (await request.json().catch(() => null)) as { role?: string } | null;
  const role = body?.role;

  if (!isRole(role)) {
    return NextResponse.json({ error: "Papel deve ser 'admin' ou 'viewer'" }, { status: 400 });
  }

  if (check.userId === id && role !== 'admin') {
    return NextResponse.json(
      { error: 'Você não pode remover o próprio acesso de administrador' },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('profiles').update({ role }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: remove o acesso de um membro (deleta o usuário no auth; a linha em
// `profiles` cai em cascata pela FK `on delete cascade`).
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { id } = await params;

  if (check.userId === id) {
    return NextResponse.json(
      { error: 'Você não pode remover o próprio acesso' },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
