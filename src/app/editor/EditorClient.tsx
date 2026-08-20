'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

/* ── Constantes ── */
const W = 1920;
const H = 1080;
const SCALE = 0.45; // escala do preview

const CHAMPS = [
  { key: 'serie-a',      label: 'Brasileirão Série A', logo: '/campeonatos/brasileirao-serie-a.png' },
  { key: 'serie-b',      label: 'Brasileirão Série B', logo: '/campeonatos/brasileirao-serie-b.png' },
  { key: 'serie-c',      label: 'Brasileirão Série C', logo: '/campeonatos/brasileirao-serie-c.png' },
  { key: 'copa-nordeste', label: 'Copa do Nordeste',   logo: '/campeonatos/copa-nordeste.png' },
];

interface Team { name: string; path: string; }

/* ── Slider helper ── */
function Slider({ label, value, min, max, step = 1, fmt, onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  fmt?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: '#666' }}>
        <span>{label}</span>
        <span style={{ color: '#aaa' }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: '#FF6600', height: 4 }}
      />
    </div>
  );
}

/* ── Página ── */
export default function EditorPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgCache   = useRef(new Map<string, HTMLImageElement>());

  /* Dados */
  const [teamsData, setTeamsData] = useState<Record<string, Team[]>>({});

  /* Controles */
  const [champ,   setChamp]   = useState(CHAMPS[0]);
  const [teamA,   setTeamA]   = useState<Team | null>(null);
  const [teamB,   setTeamB]   = useState<Team | null>(null);
  const [bgUrl,   setBgUrl]   = useState<string | null>(null);
  const [score,   setScore]   = useState('');
  const [credit,  setCredit]  = useState('');
  const [posX,        setPosX]        = useState(1310);
  const [posY,        setPosY]        = useState(500);
  const [escala,      setEscala]      = useState(1.0);
  const [bgZoom,      setBgZoom]      = useState(100);
  const [shadowOn,    setShadowOn]    = useState(false);
  const [shadowBlur,  setShadowBlur]  = useState(40);
  const [shadowOpacity, setShadowOpacity] = useState(60);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeamsData).catch(() => {});
  }, []);

  /* Carrega imagem com cache */
  const loadImg = useCallback((src: string): Promise<HTMLImageElement> => {
    const cached = imgCache.current.get(src);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => { imgCache.current.set(src, img); resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /* Desenha no canvas */
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Fundo escuro */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, W, H);

    /* 1 — Foto de fundo (cover + zoom) */
    if (bgUrl) {
      try {
        const bg = await loadImg(bgUrl);
        const r  = Math.max(W / bg.width, H / bg.height) * (bgZoom / 100);
        const bw = bg.width  * r;
        const bh = bg.height * r;
        ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
      } catch { /* sem fundo */ }
    }

    /* 2 — Logo do campeonato (canto superior direito) */
    try {
      const cl  = await loadImg(champ.logo);
      const mw  = 260, mh = 150;
      const r   = Math.min(mw / cl.width, mh / cl.height);
      const cw  = cl.width  * r;
      const ch  = cl.height * r;
      ctx.drawImage(cl, W - cw - 60, 50, cw, ch);
    } catch { /* sem logo */ }

    /* 3 — Grupo confronto (movível + escalável) */
    ctx.save();
    ctx.translate(posX, posY);
    ctx.scale(escala, escala);

    const logoSz  = 220;
    const half    = logoSz / 2;
    const spread  = 310; // distância do centro a cada logo

    /* Sombra / blur atrás do confronto */
    if (shadowOn) {
      ctx.save();
      ctx.filter = `blur(${shadowBlur}px)`;
      ctx.fillStyle = `rgba(0,0,0,${shadowOpacity / 100})`;
      const sw = spread * 2 + logoSz + 80;
      const sh = logoSz + 120;
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.filter = 'none';
      ctx.restore();
    }

    /* Time A */
    if (teamA) {
      try {
        const ia = await loadImg(teamA.path);
        // fit quadrado
        const r  = Math.min(logoSz / ia.width, logoSz / ia.height);
        const iw = ia.width  * r;
        const ih = ia.height * r;
        ctx.drawImage(ia, -spread - iw / 2, -ih / 2, iw, ih);
      } catch { /* sem escudo */ }
    }

    /* X */
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 96px "Arial Black", Arial, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', 0, 0);

    /* Time B */
    if (teamB) {
      try {
        const ib = await loadImg(teamB.path);
        const r  = Math.min(logoSz / ib.width, logoSz / ib.height);
        const iw = ib.width  * r;
        const ih = ib.height * r;
        ctx.drawImage(ib, spread - iw / 2, -ih / 2, iw, ih);
      } catch { /* sem escudo */ }
    }

    /* Placar / Horário */
    if (score) {
      ctx.fillStyle    = '#FFFFFF';
      ctx.font         = 'bold 76px "Arial Black", Arial, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(score.toUpperCase(), 0, half + 28);
    }

    ctx.restore();

    /* 4 — Crédito (canto inferior esquerdo) */
    if (credit) {
      ctx.fillStyle    = 'rgba(255,255,255,0.88)';
      ctx.font         = '26px Arial, sans-serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`FOTO: ${credit.toUpperCase()}`, 30, H - 22);
    }
  }, [bgUrl, bgZoom, champ, teamA, teamB, score, credit, posX, posY, escala, shadowOn, shadowBlur, shadowOpacity, loadImg]);

  useEffect(() => { draw(); }, [draw]);

  /* Download PNG 1920×1080 */
  const handleDownload = async () => {
    await draw();
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      const vs  = [teamA?.name, teamB?.name].filter(Boolean).join(' X ') || 'arte';
      a.download = `${champ.label} – ${vs}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const champTeams = teamsData[champ.key] ?? [];

  /* ── Render ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0D0D0D' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)', flexShrink: 0 }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Globo Esporte" className="h-9 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
            <span className="text-white font-black text-lg uppercase tracking-widest">Editor de Arte</span>
          </div>
          <nav className="flex gap-5 text-sm">
            <a href="/"      className="text-white/75 hover:text-white transition-colors">Selos do Dia</a>
            <a href="/admin" className="text-white/75 hover:text-white transition-colors">Admin</a>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ Painel lateral ══ */}
        <aside
          className="w-80 flex-shrink-0 flex flex-col overflow-y-auto"
          style={{ backgroundColor: '#141414', borderRight: '1px solid #222' }}
        >
          <div className="p-5 flex flex-col gap-6">

            {/* Foto de fundo */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6600' }}>Foto de fundo</p>
              <label
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer py-6 transition-all"
                style={{ borderColor: bgUrl ? '#FF6600' : '#2a2a2a', backgroundColor: bgUrl ? 'rgba(255,102,0,0.04)' : 'transparent' }}
              >
                <span className="text-3xl select-none">📷</span>
                <span className="text-xs font-semibold" style={{ color: bgUrl ? '#FF6600' : '#555' }}>
                  {bgUrl ? 'Trocar foto' : 'Selecionar foto'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (bgUrl) { URL.revokeObjectURL(bgUrl); imgCache.current.delete(bgUrl); }
                  setBgUrl(URL.createObjectURL(f));
                }} />
              </label>
              {bgUrl && (
                <div className="mt-3">
                  <Slider
                    label="Zoom da foto" value={bgZoom} min={50} max={200}
                    fmt={(v) => `${v}%`} onChange={setBgZoom}
                  />
                </div>
              )}
            </section>

            {/* Campeonato */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6600' }}>Campeonato</p>
              <select
                value={champ.key}
                onChange={(e) => {
                  const c = CHAMPS.find((o) => o.key === e.target.value)!;
                  setChamp(c); setTeamA(null); setTeamB(null);
                }}
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
              >
                {CHAMPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </section>

            {/* Times */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF6600' }}>Confronto</p>

              {champTeams.length === 0 && (
                <p className="text-xs p-3 rounded-lg leading-relaxed" style={{ color: '#555', backgroundColor: '#1a1a1a' }}>
                  Nenhum time encontrado.<br />
                  Adicione logos em:<br />
                  <code style={{ color: '#444' }}>public/times/{champ.key}/</code>
                </p>
              )}

              {(['A', 'B'] as const).map((lado) => {
                const sel  = lado === 'A' ? teamA : teamB;
                const set  = lado === 'A' ? setTeamA : setTeamB;
                const lbl  = lado === 'A' ? 'Time A (mandante)' : 'Time B (visitante)';
                return (
                  <div key={lado}>
                    <p className="text-xs mb-1.5" style={{ color: '#666' }}>{lbl}</p>
                    <select
                      value={sel?.path ?? ''}
                      onChange={(e) => set(champTeams.find((t) => t.path === e.target.value) ?? null)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                      style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
                    >
                      <option value="">— Selecionar —</option>
                      {champTeams.map((t) => <option key={t.path} value={t.path}>{t.name}</option>)}
                    </select>
                  </div>
                );
              })}
            </section>

            {/* Placar / Horário */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6600' }}>Placar / Horário</p>
              <input
                type="text" value={score} onChange={(e) => setScore(e.target.value)}
                placeholder="ex: DOMINGO 16:00"
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
              />
            </section>

            {/* Crédito */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6600' }}>Crédito do fotógrafo</p>
              <input
                type="text" value={credit} onChange={(e) => setCredit(e.target.value)}
                placeholder="ex: João Silva / Sport"
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
              />
            </section>

            {/* Sombra do confronto */}
            <section className="flex flex-col gap-4" style={{ borderTop: '1px solid #1e1e1e', paddingTop: 20 }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF6600' }}>Sombra do confronto</p>
                <button
                  onClick={() => setShadowOn((v) => !v)}
                  className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
                  style={{
                    backgroundColor: shadowOn ? '#FF6600' : '#2a2a2a',
                    color: shadowOn ? '#fff' : '#666',
                  }}
                >
                  {shadowOn ? 'Ligada' : 'Desligada'}
                </button>
              </div>
              {shadowOn && (
                <>
                  <Slider
                    label="Blur" value={shadowBlur} min={0} max={100}
                    fmt={(v) => `${v}px`} onChange={setShadowBlur}
                  />
                  <Slider
                    label="Opacidade" value={shadowOpacity} min={0} max={100}
                    fmt={(v) => `${v}%`} onChange={setShadowOpacity}
                  />
                </>
              )}
            </section>

            {/* Posição + escala */}
            <section className="flex flex-col gap-4" style={{ borderTop: '1px solid #1e1e1e', paddingTop: 20 }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF6600' }}>Posição do confronto</p>

              <Slider label="Horizontal (X)" value={posX} min={300} max={1800} onChange={setPosX} />
              <Slider label="Vertical (Y)"   value={posY} min={100} max={900}  onChange={setPosY} />
              <Slider
                label="Escala" value={Math.round(escala * 100)} min={30} max={200}
                fmt={(v) => `${v}%`}
                onChange={(v) => setEscala(v / 100)}
              />

              <button
                onClick={() => { setPosX(1310); setPosY(500); setEscala(1.0); }}
                className="text-xs transition-colors text-left"
                style={{ color: '#444' }}
              >
                ↺ Resetar posição
              </button>
            </section>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #CC0000, #FF6600, #FFC200)' }}
            >
              ⬇ Baixar 1920 × 1080
            </button>

          </div>
        </aside>

        {/* ══ Preview Canvas ══ */}
        <main
          className="flex-1 flex items-center justify-center"
          style={{ backgroundColor: '#0a0a0a', overflow: 'hidden' }}
        >
          <div style={{
            position: 'relative',
            width:  W * SCALE,
            height: H * SCALE,
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04)',
          }}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              style={{ display: 'block', transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
            />
          </div>
        </main>

      </div>
    </div>
  );
}
