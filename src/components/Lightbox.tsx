'use client';

import { useEffect, useCallback } from 'react';
import { ImageData, Annotations } from '@/types';

interface LightboxProps {
  images: ImageData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  annotations: Annotations;
  onToggleApproved: (filename: string) => void;
  onToggleRejected: (filename: string) => void;
  onUpdateNote: (filename: string, note: string) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  annotations,
  onToggleApproved,
  onToggleRejected,
  onUpdateNote,
}: LightboxProps) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  const ann     = annotations[current.filename] ?? { approved: false, rejected: false, note: '' };
  const tagged  = ann.approved || ann.rejected;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft'  && hasPrev) onNavigate(currentIndex - 1);
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
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {currentIndex + 1} / {images.length}
        </span>
        <span className="text-sm font-bold truncate max-w-[40%] sm:max-w-md text-center" style={{ color: '#FFD700' }}>
          {current.name}
        </span>
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
        >‹</button>
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
        >›</button>
      )}

      {/* ── Conteúdo ── */}
      <div
        className="flex flex-col items-center gap-3 w-full px-14 sm:px-20 max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.name}
          className="max-h-[62vh] max-w-full object-contain rounded-lg"
          style={{ boxShadow: '0 8px 50px rgba(0,0,0,0.9)' }}
        />

        {/* Filmstrip */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
          {images.map((img, i) => (
            <button
              key={img.filename}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className="flex-shrink-0 rounded overflow-hidden transition-all duration-200"
              style={{
                width: 52, height: 34,
                opacity: i === currentIndex ? 1 : 0.4,
                border: i === currentIndex ? '2px solid #FF6600' : '2px solid transparent',
                transform: i === currentIndex ? 'scale(1.12)' : 'scale(1)',
              }}
              aria-label={`Ir para ${img.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* ── Painel de anotação ── */}
        <div
          className="w-full flex flex-col sm:flex-row items-start gap-3 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Botões Aprovado / Caiu */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onToggleApproved(current.filename)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{
                backgroundColor: ann.approved ? '#4ade80' : '#2a2a2a',
                color: ann.approved ? '#052e16' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${ann.approved ? '#4ade80' : '#444'}`,
              }}
            >
              ✓ Aprovado
            </button>
            <button
              type="button"
              onClick={() => onToggleRejected(current.filename)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{
                backgroundColor: ann.rejected ? '#f87171' : '#2a2a2a',
                color: ann.rejected ? '#7f1d1d' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${ann.rejected ? '#f87171' : '#444'}`,
              }}
            >
              ✗ Caiu
            </button>
          </div>

          {/* Textarea — some quando aprovado ou caiu */}
          {!tagged && (
            <textarea
              value={ann.note}
              onChange={(e) => onUpdateNote(current.filename, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Observação..."
              rows={2}
              className="flex-1 w-full px-3 py-2 rounded-lg text-sm resize-none outline-none transition-colors"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#ccc', minWidth: 0 }}
              onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#FF6600'; }}
              onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#444'; }}
            />
          )}
        </div>
      </div>

    </div>
  );
}
