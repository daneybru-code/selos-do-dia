'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageData } from '@/types';
import Gallery from './Gallery';

function getFormattedDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ViewerGate() {
  const [authed, setAuthed]     = useState(false);
  const [checking, setChecking] = useState(true);   // verifica sessionStorage no mount
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages]     = useState<ImageData[]>([]);
  const [date, setDate]         = useState('');

  /* ── Busca imagens ── */
  const fetchImages = useCallback(async () => {
    try {
      const res  = await fetch('/api/images');
      const data = await res.json();
      setImages(data.images ?? []);
    } catch {
      setImages([]);
    }
  }, []);

  /* ── Restaura sessão ao montar ── */
  useEffect(() => {
    setDate(getFormattedDate());
    if (sessionStorage.getItem('viewer_authed') === '1') {
      setAuthed(true);
      fetchImages();
    }
    setChecking(false);
  }, [fetchImages]);

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/viewer-auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem('viewer_authed', '1');
        setAuthed(true);
        fetchImages();
      } else {
        setError('Senha incorreta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading inicial (evita flash) ── */
  if (checking) return null;

  /* ══════════════ TELA DE LOGIN ══════════════ */
  if (!authed) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: '#0D0D0D' }}
      >
        {/* Card */}
        <div
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          {/* Header do card com gradiente */}
          <div
            className="px-8 pt-8 pb-6 flex flex-col items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Globo Esporte"
              className="h-12 object-contain"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
            />
            <h1 className="text-white text-xl font-black uppercase tracking-widest">
              Selos do Dia
            </h1>
          </div>

          {/* Formulário */}
          <div className="px-8 py-7">
            <p className="text-gray-400 text-sm text-center mb-5">
              Digite a senha para acessar
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl text-white outline-none border-2 transition-colors"
                style={{
                  backgroundColor: '#2a2a2a',
                  borderColor: error ? '#CC0000' : 'transparent',
                }}
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-sm text-center -mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !password}
                className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #CC0000, #FF6600, #FFC200)' }}
              >
                {submitting ? '…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-6">Globo Esporte · Uso interno</p>
      </div>
    );
  }

  /* ══════════════ GALERIA ══════════════ */
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

      {/* Header */}
      <header
        style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Globo Esporte"
            className="h-14 sm:h-20 object-contain"
            style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.5))' }}
          />
          <h1
            className="text-white text-3xl sm:text-4xl font-black uppercase tracking-widest"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            Selos do Dia
          </h1>
          <p className="text-white/90 text-base sm:text-lg capitalize font-medium">{date}</p>
          {images.length > 0 && (
            <span className="bg-black/25 text-white text-sm font-semibold px-4 py-1 rounded-full">
              {images.length} {images.length === 1 ? 'selo' : 'selos'}
            </span>
          )}
        </div>
      </header>

      {/* Gallery */}
      <Gallery images={images} />

      {/* Footer */}
      <footer className="text-center py-8 text-sm" style={{ color: '#444' }}>
        Globo Esporte · Selos do Dia
      </footer>

    </main>
  );
}
