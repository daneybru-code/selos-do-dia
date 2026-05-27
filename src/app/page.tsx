import fs from 'fs';
import path from 'path';
import Gallery from '@/components/Gallery';

export interface ImageData {
  filename: string;
  name: string;
  src: string;
}

async function getImages(): Promise<ImageData[]> {
  try {
    const selosDir = path.join(process.cwd(), 'public', 'selos');

    if (!fs.existsSync(selosDir)) {
      return [];
    }

    const files = fs.readdirSync(selosDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    return files
      .filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
      )
      .map((file) => ({
        filename: file,
        name: path.basename(file, path.extname(file)),
        src: `/selos/${encodeURIComponent(file)}`,
      }));
  } catch {
    return [];
  }
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function Home() {
  const images = await getImages();
  const date = getFormattedDate();

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

      {/* ── HEADER ── */}
      <header
        className="w-full"
        style={{
          background:
            'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center gap-3">

          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Globo Esporte"
            className="h-14 sm:h-20 object-contain"
            style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.5))' }}
          />

          {/* Título */}
          <h1
            className="text-white text-3xl sm:text-4xl font-black uppercase tracking-widest"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            Selos do Dia
          </h1>

          {/* Data */}
          <p className="text-white/90 text-base sm:text-lg capitalize font-medium">
            {date}
          </p>

          {/* Contador */}
          {images.length > 0 && (
            <span className="bg-black/25 text-white text-sm font-semibold px-4 py-1 rounded-full">
              {images.length} {images.length === 1 ? 'selo' : 'selos'}
            </span>
          )}
        </div>
      </header>

      {/* ── GALLERY ── */}
      <Gallery images={images} />

      {/* ── FOOTER ── */}
      <footer
        className="text-center py-8 text-sm"
        style={{ color: '#444' }}
      >
        Globo Esporte · Selos do Dia
      </footer>

    </main>
  );
}
