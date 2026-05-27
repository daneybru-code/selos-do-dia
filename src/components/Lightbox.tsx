'use client';

import { useEffect, useCallback } from 'react';
import { ImageData } from '@/types';

interface LightboxProps {
  images: ImageData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  /* Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
    },
    [currentIndex, hasPrev, hasNext, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizando: ${current.name}`}
    >

      {/* ── Barra superior ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
      >
        {/* Contador */}
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {currentIndex + 1} / {images.length}
        </span>

        {/* Nome da imagem */}
        <span
          className="text-sm font-bold truncate max-w-[40%] sm:max-w-md text-center"
          style={{ color: '#FFD700' }}
        >
          {current.name}
        </span>

        {/* Botão fechar */}
        <button
          className="text-4xl font-light transition-colors leading-none"
          style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}
          onClick={onClose}
          aria-label="Fechar"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#fff')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)')}
        >
          ×
        </button>
      </div>

      {/* ── Seta ANTERIOR ── */}
      {hasPrev && (
        <button
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 text-6xl font-thin select-none transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          aria-label="Imagem anterior"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#FF6600')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)')}
        >
          ‹
        </button>
      )}

      {/* ── Seta PRÓXIMA ── */}
      {hasNext && (
        <button
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 text-6xl font-thin select-none transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          aria-label="Próxima imagem"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#FF6600')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)')}
        >
          ›
        </button>
      )}

      {/* ── Imagem principal + filmstrip ── */}
      <div
        className="flex flex-col items-center gap-4 w-full px-14 sm:px-20 max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.name}
          className="max-h-[75vh] max-w-full object-contain rounded-lg"
          style={{ boxShadow: '0 8px 50px rgba(0,0,0,0.9)' }}
        />

        {/* Filmstrip de miniaturas */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
          {images.map((img, i) => (
            <button
              key={img.filename}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className="flex-shrink-0 rounded overflow-hidden transition-all duration-200"
              style={{
                width: 52,
                height: 34,
                opacity: i === currentIndex ? 1 : 0.4,
                border: i === currentIndex ? '2px solid #FF6600' : '2px solid transparent',
                transform: i === currentIndex ? 'scale(1.12)' : 'scale(1)',
              }}
              aria-label={`Ir para ${img.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
