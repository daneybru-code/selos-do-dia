'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não são iguais');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Globo Esporte" className="h-16 w-fit object-contain mx-auto mb-8" />

        <h1 className="font-heading italic text-white text-2xl font-black uppercase tracking-widest mb-1 text-center">
          Definir senha
        </h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Escolha a senha da sua conta
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Nova senha"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
          />

          {error && <p className="text-red-400 text-sm text-center -mt-1">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
          >
            {saving ? 'Salvando…' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
