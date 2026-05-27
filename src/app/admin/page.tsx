'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface BlobImage {
  filename: string;
  name: string;
  src: string;
}

export default function AdminPage() {
  const [authed, setAuthed]               = useState(false);
  const [password, setPassword]           = useState('');
  const [authError, setAuthError]         = useState('');
  const [images, setImages]               = useState<BlobImage[]>([]);
  const [loading, setLoading]             = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadMsg, setUploadMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [dragOver, setDragOver]           = useState(false);
  const [deleting, setDeleting]           = useState<string | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const storedPw                          = useRef('');

  /* ── Restaura sessão ── */
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) {
      storedPw.current = saved;
      setAuthed(true);
      fetchImages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Lista imagens do Blob ── */
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/images');
      const data = await res.json();
      setImages(data.images ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin_pw', password);
      storedPw.current = password;
      setAuthed(true);
      fetchImages();
    } else {
      setAuthError('Senha incorreta');
    }
  };

  /* ── Upload ── */
  const uploadFiles = useCallback(async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;

    setUploading(true);
    setUploadMsg({ text: `Enviando ${imgs.length} imagem(ns)…`, ok: true });

    const form = new FormData();
    imgs.forEach((f) => form.append('files', f));

    const res = await fetch('/api/upload', {
      method:  'POST',
      headers: { 'x-admin-password': storedPw.current },
      body:    form,
    });

    if (res.ok) {
      const data = await res.json();
      setUploadMsg({ text: `✅ ${data.uploaded.length} imagem(ns) enviada(s)!`, ok: true });
      fetchImages();
    } else {
      const err = await res.json();
      setUploadMsg({ text: `❌ ${err.error ?? 'Erro ao enviar'}`, ok: false });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [fetchImages]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }, [uploadFiles]);

  /* ── Delete ── */
  const handleDelete = async (image: BlobImage) => {
    if (!confirm(`Remover "${image.name}"?`)) return;
    setDeleting(image.src);
    await fetch('/api/delete', {
      method:  'DELETE',
      headers: {
        'Content-Type':    'application/json',
        'x-admin-password': storedPw.current,
      },
      body: JSON.stringify({ url: image.src }),
    });
    setDeleting(null);
    fetchImages();
  };

  /* ══════════════ TELA DE LOGIN ══════════════ */
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#0D0D0D' }}
      >
        <div
          className="w-full max-w-sm p-8 rounded-2xl"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          <div className="text-center mb-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Globo Esporte" className="h-12 mx-auto mb-4 object-contain" />
            <h1 className="text-white text-xl font-bold">Admin — Selos do Dia</h1>
            <p className="text-gray-500 text-sm mt-1">Área restrita</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
              className="w-full px-4 py-3 rounded-xl text-white outline-none border-2 border-transparent transition-colors"
              style={{ backgroundColor: '#2a2a2a', borderColor: authError ? '#CC0000' : 'transparent' }}
              autoFocus
            />

            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #CC0000, #FF6600, #FFC200)' }}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ══════════════ PAINEL ADMIN ══════════════ */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Globo Esporte" className="h-9 object-contain" />
            <span className="text-white font-bold">Admin — Selos do Dia</span>
          </div>
          <a
            href="/"
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            ← Ver galeria
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* ── Zona de upload ── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Adicionar selos</h2>

          <div
            className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragOver ? '#FF6600' : '#444',
              backgroundColor: dragOver ? 'rgba(255,102,0,0.08)' : 'transparent',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#FF6600', borderTopColor: 'transparent' }}
                />
                <p className="text-white text-base">Enviando…</p>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-3 select-none">📤</div>
                <p className="text-white text-lg font-semibold">Arraste as imagens aqui</p>
                <p className="text-gray-400 text-sm mt-1">ou clique para selecionar</p>
                <p className="text-gray-600 text-xs mt-2">PNG · JPG · JPEG · WEBP</p>
              </>
            )}

            {uploadMsg && (
              <p
                className="mt-4 text-sm font-semibold"
                style={{ color: uploadMsg.ok ? '#4ade80' : '#f87171' }}
              >
                {uploadMsg.text}
              </p>
            )}
          </div>
        </section>

        {/* ── Imagens publicadas ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">
              Selos publicados{' '}
              <span className="text-gray-500 font-normal text-sm">
                ({images.length})
              </span>
            </h2>
            <button
              onClick={fetchImages}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ↻ Atualizar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div
                className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: '#FF6600', borderTopColor: 'transparent' }}
              />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500">Nenhum selo publicado ainda</p>
              <p className="text-gray-600 text-sm mt-1">Arraste imagens acima para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.src}
                  className="group relative rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#1A1A1A' }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Label */}
                  <div className="px-2 py-2">
                    <p
                      className="text-xs truncate font-medium"
                      style={{ color: '#FFD700' }}
                      title={image.name}
                    >
                      {image.name}
                    </p>
                  </div>

                  {/* Botão remover */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold opacity-0 group-hover:opacity-100 transition-all"
                    style={{
                      backgroundColor: deleting === image.src ? '#555' : '#CC0000',
                    }}
                    onClick={() => handleDelete(image)}
                    disabled={deleting === image.src}
                    title="Remover selo"
                  >
                    {deleting === image.src ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
