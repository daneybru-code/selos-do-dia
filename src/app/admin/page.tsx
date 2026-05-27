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
  // Seleção múltipla
  const [selectMode, setSelectMode]       = useState(false);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk]   = useState(false);
  // Reordenação por drag
  const [dragIndex, setDragIndex]         = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saving, setSaving]               = useState(false);
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

  /* ── Lista imagens ── */
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

  const onFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }, [uploadFiles]);

  /* ── Delete individual ── */
  const handleDelete = async (image: BlobImage) => {
    if (!confirm(`Remover "${image.name}"?`)) return;
    setDeleting(image.src);
    await fetch('/api/delete', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw.current },
      body:    JSON.stringify({ url: image.src }),
    });
    setDeleting(null);
    fetchImages();
  };

  /* ── Delete em massa ── */
  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Remover ${selected.size} selo(s) selecionado(s)?`)) return;
    setDeletingBulk(true);
    await fetch('/api/delete', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw.current },
      body:    JSON.stringify({ urls: Array.from(selected) }),
    });
    setDeletingBulk(false);
    setSelected(new Set());
    setSelectMode(false);
    fetchImages();
  };

  const toggleSelect = (src: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map((img) => img.src)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  /* ── Drag reorder ── */
  const handleCardDragStart = (index: number) => setDragIndex(index);

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null) setDragOverIndex(index);
  };

  const handleCardDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); return; }

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setImages(reordered);
    setDragIndex(null);

    setSaving(true);
    await fetch('/api/reorder', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': storedPw.current },
      body:    JSON.stringify({ order: reordered.map((img) => img.src) }),
    });
    setSaving(false);
  };

  const handleCardDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
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
          <a href="/" className="text-white/80 hover:text-white text-sm transition-colors">
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
              borderColor:     dragOver ? '#FF6600' : '#444',
              backgroundColor: dragOver ? 'rgba(255,102,0,0.08)' : 'transparent',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              // só ativa se estiver arrastando arquivos, não cards
              if ([...e.dataTransfer.types].includes('Files')) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onFileDrop}
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

          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-white font-bold text-lg">
              Selos publicados{' '}
              <span className="text-gray-500 font-normal text-sm">({images.length})</span>
            </h2>

            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-xs" style={{ color: '#888' }}>Salvando ordem…</span>
              )}

              {selectMode ? (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm transition-colors"
                    style={{ color: '#aaa' }}
                  >
                    {selected.size === images.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={!selected.size || deletingBulk}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: '#CC0000' }}
                  >
                    {deletingBulk ? 'Removendo…' : `Excluir${selected.size ? ` (${selected.size})` : ''}`}
                  </button>
                  <button
                    onClick={exitSelectMode}
                    className="text-sm transition-colors"
                    style={{ color: '#888' }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {images.length > 0 && (
                    <button
                      onClick={() => setSelectMode(true)}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: '#888' }}
                    >
                      Selecionar
                    </button>
                  )}
                  <button
                    onClick={fetchImages}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: '#888' }}
                  >
                    ↻ Atualizar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dica de reordenação */}
          {!selectMode && images.length > 1 && (
            <p className="text-xs mb-4" style={{ color: '#555' }}>
              Arraste os selos para reordenar. A ordem é salva automaticamente.
            </p>
          )}

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
              {images.map((image, index) => {
                const isSelected    = selected.has(image.src);
                const isDragging    = dragIndex === index;
                const isDragTarget  = dragOverIndex === index && dragIndex !== index;

                return (
                  <div
                    key={image.src}
                    className="group relative rounded-xl overflow-hidden select-none"
                    style={{
                      backgroundColor: '#1A1A1A',
                      border:   `2px solid ${isSelected || isDragTarget ? '#FF6600' : 'transparent'}`,
                      opacity:  isDragging ? 0.4 : 1,
                      cursor:   selectMode ? 'pointer' : 'grab',
                      transition: 'border-color 0.15s, opacity 0.15s, box-shadow 0.15s',
                      boxShadow: isDragTarget ? '0 0 0 2px rgba(255,102,0,0.3)' : undefined,
                    }}
                    draggable={!selectMode}
                    onDragStart={() => handleCardDragStart(index)}
                    onDragOver={(e) => handleCardDragOver(e, index)}
                    onDrop={(e) => handleCardDrop(e, index)}
                    onDragEnd={handleCardDragEnd}
                    onClick={() => selectMode && toggleSelect(image.src)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt={image.name}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        draggable={false}
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

                    {/* Modo seleção: checkbox */}
                    {selectMode && (
                      <div className="absolute top-2 left-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center border-2 transition-colors"
                          style={{
                            backgroundColor: isSelected ? '#FF6600' : 'rgba(0,0,0,0.6)',
                            borderColor:     isSelected ? '#FF6600' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Modo normal: ícone drag handle + botão excluir */}
                    {!selectMode && (
                      <>
                        {/* Drag handle */}
                        <div
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5"
                          style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'grab' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="#ccc">
                            <circle cx="3.5" cy="2.5" r="1.1"/>
                            <circle cx="8.5" cy="2.5" r="1.1"/>
                            <circle cx="3.5" cy="6"   r="1.1"/>
                            <circle cx="8.5" cy="6"   r="1.1"/>
                            <circle cx="3.5" cy="9.5" r="1.1"/>
                            <circle cx="8.5" cy="9.5" r="1.1"/>
                          </svg>
                        </div>

                        {/* Botão remover */}
                        <button
                          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold opacity-0 group-hover:opacity-100 transition-all"
                          style={{ backgroundColor: deleting === image.src ? '#555' : '#CC0000' }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(image); }}
                          disabled={deleting === image.src}
                          title="Remover selo"
                        >
                          {deleting === image.src ? '…' : '×'}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
