import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import './globals.css';

// Tipografia dos títulos: o pedido original era Acumin/Acumin Condensed
// (fontes comerciais da Adobe, sem licença para self-hosting em web e fora
// do Google Fonts) — Barlow Condensed é a alternativa gratuita mais próxima:
// condensada, humanista, com itálico de verdade (não é um "oblique"
// sintético) e o mesmo tom esportivo/editorial. Carregada via
// `next/font/google` (self-hosted pelo Next, sem CDN externo) só nos pesos
// bold/black em itálico, que é o que os títulos usam.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['italic'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Selos do Dia — Globo Esporte',
  description: 'Galeria de selos gráficos diários do Globo Esporte',
  openGraph: {
    title: 'Selos do Dia — Globo Esporte',
    description: 'Consulte os selos produzidos hoje pelo time de arte do Globo Esporte',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={barlowCondensed.variable}>
      <body>{children}</body>
    </html>
  );
}
