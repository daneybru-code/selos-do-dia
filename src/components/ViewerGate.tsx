'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ImageData } from '@/types';
import Gallery from './Gallery';
import { logout } from '@/app/login/actions';

function getFormattedDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// A autenticação (sessão Supabase) já é garantida pelo proxy (src/proxy.ts)
// antes de qualquer request chegar aqui — não há mais senha de visualizador
// nem sessionStorage. Este componente só renderiza a galeria.
export default function ViewerGate({ message }: { message?: string }) {
  const [images, setImages] = useState<ImageData[]>([]);
  // Data pura (não depende de nada reativo) — computada direto no render em
  // vez de guardada em estado, evitando setState síncrono dentro de effect.
  const date = getFormattedDate();

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      setImages(data.images ?? []);
    } catch {
      setImages([]);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

      {/* Header */}
      <header
        style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center gap-3 relative">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2">
            <Link
              href="/definir-senha"
              className="text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider bg-black/20 hover:bg-black/35 px-3 py-1.5 rounded-full transition-colors"
            >
              Trocar senha
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider bg-black/20 hover:bg-black/35 px-3 py-1.5 rounded-full transition-colors"
              >
                Sair
              </button>
            </form>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Globo Esporte"
            className="h-14 sm:h-20 object-contain"
            style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.5))' }}
          />
          <h1
            className="font-heading italic text-white text-3xl sm:text-4xl font-black uppercase tracking-widest"
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

      {message && (
        <p className="text-center text-sm text-amber-400 bg-amber-950/40 py-2 px-4">
          {message}
        </p>
      )}

      {/* Gallery */}
      <Gallery images={images} />

      {/* Footer */}
      <footer className="text-center py-8 text-sm" style={{ color: '#444' }}>
        Globo Esporte · Selos do Dia
      </footer>

    </main>
  );
}
