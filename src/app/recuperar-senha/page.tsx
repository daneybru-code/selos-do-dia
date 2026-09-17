'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/definir-senha`,
    });

    // Limitação conhecida: o envio de e-mail usa Resend sem domínio
    // verificado, então só entrega de verdade pro e-mail dono da conta
    // Resend — para qualquer outro destinatário, essa chamada falha (mesmo
    // padrão já visto com inviteUserByEmail). O fallback abaixo cobre esse
    // caso, sem expor o erro técnico pro usuário.
    setStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Globo Esporte" className="h-16 w-fit object-contain mx-auto mb-8" />

        <h1 className="font-heading italic text-white text-2xl font-black uppercase tracking-widest mb-1 text-center">
          Esqueci minha senha
        </h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Informe seu e-mail para receber um link de recuperação
        </p>

        {status === 'sent' ? (
          <p className="text-gray-300 text-sm text-center">
            Se esse e-mail tiver uma conta, você vai receber um link em
            instantes. Confira também a caixa de spam.
          </p>
        ) : status === 'error' ? (
          <p className="text-red-400 text-sm text-center">
            Não foi possível enviar o e-mail agora. Peça para um administrador
            gerar um link de acesso para você.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <p className="text-center mt-6">
          <Link
            href="/login"
            className="text-gray-500 text-xs cursor-pointer hover:text-gray-300 transition-colors"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
