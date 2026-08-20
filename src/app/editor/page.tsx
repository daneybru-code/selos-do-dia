import { notFound } from 'next/navigation';
import EditorClient from './EditorClient';

// Editor de Arte só fica disponível rodando localmente.
// Em produção (Vercel) essa env var não existe, então a rota retorna 404.
// Para usar localmente: defina NEXT_PUBLIC_ENABLE_EDITOR=true no .env.local
export default function EditorPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_EDITOR !== 'true') {
    notFound();
  }
  return <EditorClient />;
}
