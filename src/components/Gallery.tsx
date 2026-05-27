'use client';

import { useState } from 'react';
import { ImageData } from '@/app/page';
import Lightbox from './Lightbox';

interface GalleryProps {
  images: ImageData[];
}

export default function Gallery({ images }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /* ── Estado vazio ── */
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <div className="text-7xl select-none">📁</div>
        <p className="text-gray-400 text-xl font-semibold">Nenhum selo encontrado</p>
        <p className="text-gray-600 text-sm text-center max-w-sm leading-relaxed">
          Adicione imagens na pasta{' '}
          <code
            className="px-2 py-0.5 rounded text-sm"
            style={{ backgroundColor: '#1a1a1a', color: '#FF6600' }}
          >
            public/selos/
          </code>{' '}
          para que elas apareçam aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((image, index) => (
            <article
              key={image.filename}
              className="group cursor-pointer"
              onClick={() => setSelectedIndex(index)}
              role="button"
              tabIndex={0}
              aria-label={`Abrir ${image.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedIndex(index);
                }
              }}
            >
              {/* Card */}
              <div
                className="relative overflow-hidden rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = '#FF6600';
                  el.style.boxShadow = '0 0 22px rgba(255, 102, 0, 0.35)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = 'transparent';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Thumbnail 16:9 */}
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Overlay no hover */}
                <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }}
                >
                  <span className="text-white text-xs font-bold uppercase tracking-wide">
                    🔍 Clique para ampliar
                  </span>
                </div>
              </div>

              {/* Label */}
              <p
                className="mt-2 text-sm font-semibold text-center px-1 truncate"
                style={{ color: '#FFD700' }}
                title={image.name}
              >
                {image.name}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  );
}
