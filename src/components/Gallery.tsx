'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageData, Annotation, Annotations } from '@/types';
import Lightbox from './Lightbox';

interface GalleryProps {
  images: ImageData[];
}

async function saveAnnotation(filename: string, annotation: Annotation) {
  try {
    await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, ...annotation }),
    });
  } catch { /* noop */ }
}

export default function Gallery({ images }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [annotations, setAnnotations]     = useState<Annotations>({});
  const annotationsRef                    = useRef<Annotations>({});
  const noteTimers                        = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { annotationsRef.current = annotations; }, [annotations]);

  useEffect(() => {
    fetch('/api/annotations')
      .then((r) => r.json())
      .then(setAnnotations)
      .catch(() => { /* noop */ });
  }, []);

  function getAnn(filename: string): Annotation {
    return annotations[filename] ?? { approved: false, rejected: false, note: '' };
  }

  function toggleApproved(filename: string) {
    setAnnotations((prev) => {
      const cur     = prev[filename] ?? { approved: false, rejected: false, note: '' };
      const approved = !cur.approved;
      const next = { ...prev, [filename]: { ...cur, approved, rejected: approved ? false : cur.rejected } };
      saveAnnotation(filename, next[filename]);
      return next;
    });
  }

  function toggleRejected(filename: string) {
    setAnnotations((prev) => {
      const cur      = prev[filename] ?? { approved: false, rejected: false, note: '' };
      const rejected = !cur.rejected;
      const next = { ...prev, [filename]: { ...cur, rejected, approved: rejected ? false : cur.approved } };
      saveAnnotation(filename, next[filename]);
      return next;
    });
  }

  function updateNote(filename: string, note: string) {
    setAnnotations((prev) => {
      const cur = prev[filename] ?? { approved: false, rejected: false, note: '' };
      return { ...prev, [filename]: { ...cur, note } };
    });
    if (noteTimers.current[filename]) clearTimeout(noteTimers.current[filename]);
    noteTimers.current[filename] = setTimeout(() => {
      const cur = annotationsRef.current[filename] ?? { approved: false, rejected: false, note: '' };
      saveAnnotation(filename, { ...cur, note });
    }, 600);
  }

  /* ── Estado vazio ── */
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-4 py-16">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(255,102,0,0.15) 0%, rgba(255,102,0,0.05) 70%, transparent 100%)',
            border: '2px solid rgba(255,102,0,0.2)',
            boxShadow: '0 0 32px rgba(255,102,0,0.1)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-bold text-lg" style={{ color: '#888' }}>Nenhum selo disponível hoje</p>
          <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#555' }}>Os selos do dia ainda não foram publicados. Volte mais tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((image, index) => {
            const ann    = getAnn(image.filename);
            const tagged = ann.approved || ann.rejected;

            return (
              <article key={image.filename} className="group flex flex-col">

                {/* ── Imagem — click abre lightbox ── */}
                <div
                  className="relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: `2px solid ${ann.approved ? '#4ade80' : ann.rejected ? '#f87171' : 'transparent'}`,
                    boxShadow: ann.approved
                      ? '0 0 18px rgba(74,222,128,0.25)'
                      : ann.rejected
                        ? '0 0 18px rgba(248,113,113,0.2)'
                        : 'none',
                  }}
                  onClick={() => setSelectedIndex(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir ${image.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIndex(index); }
                  }}
                  onMouseEnter={(e) => {
                    if (!tagged) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#FF6600';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 22px rgba(255,102,0,0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tagged) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }
                  }}
                >
                  <div className="aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt={image.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>

                  <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }}>
                    <span className="text-white text-xs font-bold uppercase tracking-wide">🔍 Clique para ampliar</span>
                  </div>

                  {ann.approved && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#4ade80', color: '#052e16' }}>
                      ✓ Aprovado
                    </div>
                  )}
                  {ann.rejected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#f87171', color: '#7f1d1d' }}>
                      ✗ Caiu
                    </div>
                  )}
                </div>

                {/* Label */}
                <p className="mt-2 text-sm font-semibold text-center px-1 truncate"
                  style={{ color: ann.approved ? '#4ade80' : ann.rejected ? '#f87171' : '#FFD700' }}
                  title={image.name}
                >
                  {image.name}
                </p>

                {/* ── Anotação ── */}
                <div className="mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>

                  {/* Botões Aprovado / Caiu */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleApproved(image.filename)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: ann.approved ? '#4ade80' : '#222',
                        color: ann.approved ? '#052e16' : '#555',
                        border: `1px solid ${ann.approved ? '#4ade80' : '#333'}`,
                      }}
                    >
                      ✓ Aprovado
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRejected(image.filename)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: ann.rejected ? '#f87171' : '#222',
                        color: ann.rejected ? '#7f1d1d' : '#555',
                        border: `1px solid ${ann.rejected ? '#f87171' : '#333'}`,
                      }}
                    >
                      ✗ Caiu
                    </button>
                  </div>

                  {/* Textarea — some quando aprovado ou caiu */}
                  {!tagged && (
                    <textarea
                      value={ann.note}
                      onChange={(e) => updateNote(image.filename, e.target.value)}
                      placeholder="Observação..."
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg text-xs resize-none outline-none transition-colors"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#ccc' }}
                      onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#FF6600'; }}
                      onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#333'; }}
                    />
                  )}
                </div>

              </article>
            );
          })}
        </div>
      </section>

      {selectedIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
          annotations={annotations}
          onToggleApproved={toggleApproved}
          onToggleRejected={toggleRejected}
          onUpdateNote={updateNote}
        />
      )}
    </>
  );
}
