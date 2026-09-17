'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Role = 'admin' | 'viewer';

interface Member {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
}

export default function MembrosPage() {
  const [members, setMembers]     = useState<Member[]>([]);
  const [loading, setLoading]     = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState<Role>('viewer');
  const [inviting, setInviting]       = useState(false);
  const [inviteMsg, setInviteMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [inviteLink, setInviteLink]   = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [linkCopied, setLinkCopied]   = useState(false);
  const [busyId, setBusyId]           = useState<string | null>(null);

  /* ── Lista membros. Estrutura pensada para não disparar setState síncrono
     dentro do useEffect (mesma categoria de lint conhecida documentada em
     admin/page.tsx): `loading` já começa `true` via useState, e o único
     setState desta função roda depois do primeiro `await`. ── */
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json().catch(() => ({}));
      setMembers(data.members ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  /* ── Convite ── */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    setInviteLink(null);
    setInvitedEmail(null);
    setLinkCopied(false);

    const emailToInvite = inviteEmail.trim();

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToInvite, role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setInviteMsg({ text: data.error ?? 'Falha ao enviar convite', ok: false });
        return;
      }

      setInviteMsg({ text: 'Convite criado. Copie o link abaixo e envie para a pessoa (o sistema não manda e-mail automaticamente ainda).', ok: true });
      setInviteLink(data.inviteLink ?? null);
      setInvitedEmail(emailToInvite || null);
      setInviteEmail('');
      setInviteRole('viewer');
      fetchMembers();
    } finally {
      setInviting(false);
    }
  };

  /* ── Copiar link de convite ── */
  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Ambiente sem clipboard API (ex.: http não-seguro) — sem tratamento
      // especial, o admin pode selecionar e copiar manualmente o texto.
    }
  };

  /* ── Troca de papel ── */
  const handleRoleChange = async (member: Member, role: Role) => {
    setBusyId(member.id);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Falha ao atualizar papel');
        return;
      }
      await fetchMembers();
    } finally {
      setBusyId(null);
    }
  };

  /* ── Remoção ── */
  const handleRemove = async (member: Member) => {
    if (!confirm(`Remover o acesso de "${member.email ?? member.id}"?`)) return;
    setBusyId(member.id);
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Falha ao remover acesso');
        return;
      }
      await fetchMembers();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Globo Esporte" className="h-9 object-contain" />
            <span className="text-white font-bold">Membros — Selos do Dia</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-white/80 hover:text-white text-sm transition-colors">
              ← Voltar ao painel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* ── Convidar novo membro ── */}
        <section>
          <h2 className="font-heading italic uppercase text-white font-bold text-lg mb-4">Convidar membro</h2>

          <form
            onSubmit={handleInvite}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl p-4"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            <input
              type="email"
              placeholder="email@exemplo.com"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="px-4 py-2.5 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-2.5 rounded-xl font-bold text-white uppercase tracking-wider text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
            >
              {inviting ? 'Enviando…' : 'Convidar'}
            </button>
          </form>

          {inviteMsg && (
            <p
              className="mt-3 text-sm font-semibold"
              style={{ color: inviteMsg.ok ? '#4ade80' : '#f87171' }}
            >
              {inviteMsg.text}
            </p>
          )}

          {inviteLink && (
            <div
              className="mt-3 flex flex-col gap-2 rounded-xl p-3"
              style={{ backgroundColor: '#1A1A1A' }}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-xs text-gray-300 px-2 py-1.5 rounded-lg bg-[#2a2a2a]">
                  {inviteLink}
                </code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-1.5 rounded-lg font-bold text-white text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shrink-0 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
                >
                  {linkCopied ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    'Você foi convidado para o Selos do Dia — Globo Esporte. Acesse o link para definir sua senha: ' + inviteLink,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-4 py-1.5 rounded-lg font-bold text-white text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  Enviar por WhatsApp
                </a>
                <a
                  href={`mailto:${invitedEmail ?? ''}?subject=${encodeURIComponent('Convite — Selos do Dia')}&body=${encodeURIComponent(
                    'Você foi convidado para o Selos do Dia — Globo Esporte. Acesse o link para definir sua senha e entrar: ' + inviteLink,
                  )}`}
                  className="flex-1 text-center px-4 py-1.5 rounded-lg font-bold text-white text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
                >
                  Enviar por e-mail
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ── Lista de membros ── */}
        <section>
          <h2 className="font-heading italic uppercase text-white font-bold text-lg mb-4">
            Membros{' '}
            <span
              className="normal-case not-italic text-gray-500 font-normal text-sm"
              style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, system-ui, sans-serif' }}
            >
              ({members.length})
            </span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div
                className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: '#FF6600', borderTopColor: 'transparent' }}
              />
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-center py-16">Nenhum membro encontrado</p>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: '#2a2a2a' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{member.email ?? member.id}</p>
                    <p className="text-gray-600 text-xs">
                      desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={member.role}
                      disabled={busyId === member.id}
                      onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                      className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-white text-sm outline-none border-2 border-transparent transition-colors focus:border-white/20 disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => handleRemove(member)}
                      disabled={busyId === member.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: '#CC0000' }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
