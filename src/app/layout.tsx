import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
