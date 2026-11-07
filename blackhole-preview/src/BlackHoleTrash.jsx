/**
 * BlackHoleTrash — Web twin of the React Native component.
 *
 * Select items → tap the trash icon → it transforms into a black hole →
 * selected items disintegrate into particles that spiral into the void
 * with real gravitational physics (inverse-square attraction, orbital
 * velocity, accretion-style streaks) and are consumed at the event horizon.
 *
 * The particle physics runs on a canvas at 60fps; the UI is DOM.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export const SAMPLE_FILES = [
  { id: '1', name: 'Board update.key', meta: 'Keynote · 24.8 MB', kind: 'slides' },
  { id: '2', name: 'Invoice 1042.pdf', meta: 'PDF · 312 KB', kind: 'pdf' },
  { id: '3', name: 'Sunset at Big Sur.heic', meta: 'Image · 4.1 MB', kind: 'image' },
  { id: '4', name: 'Old builds.zip', meta: 'Archive · 1.2 GB', kind: 'archive' },
  { id: '5', name: 'Notes from call.txt', meta: 'Text · 2 KB', kind: 'text' },
];

const KIND_ICON = {
  slides: '📊',
  pdf: '📄',
  image: '🖼️',
  archive: '📦',
  text: '📝',
  key: '🔑',
  audio: '🎵',
  video: '🎬',
  code: '💻',
};

const KIND_COLOR = {
  slides: '#f59e0b',
  pdf: '#ef4444',
  image: '#a855f7',
  archive: '#64748b',
  text: '#3b82f6',
  key: '#22c55e',
  audio: '#ec4899',
  video: '#06b6d4',
  code: '#84cc16',
};

function kindIcon(kind) {
  return (kind && KIND_ICON[kind]) || '📄';
}

function kindColor(kind, fallback = '#64748b') {
  return (kind && KIND_COLOR[kind]) || fallback;
}

function rgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default forwardRef(function BlackHoleTrash(props, ref) {
  const {
    color = '#ff8a3d',
    particlesPerItem = 40,
    gravity = 2.5e7,
    spin = 1,
    items: controlled,
    defaultItems = SAMPLE_FILES,
    onItemsChange,
    onDelete,
    width = 380,
    className = '',
  } = props;

  const isControlled = controlled !== undefined;
  const [list, setList] = useState(isControlled ? controlled : defaultItems);
  const [selected, setSelected] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | transforming | consuming | done
  const [dissolving, setDissolving] = useState([]);

  useEffect(() => {
    if (isControlled) {
      setList(controlled);
      setSelected([]);
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled]);

  /* ---------- refs ---------- */
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const trashRef = useRef(null);
  const holeBtnRef = useRef(null);
  const rowEls = useRef({});

  /* ---------- hole state ---------- */
  const hole = useRef({ x: 0, y: 0, r: 26, mass: 1, angle: 0, flashes: [] });
  const particles = useRef([]);
  const rafRef = useRef(null);
  const dissolveTimers = useRef([]);

  const setRowRef = useCallback((id) => (el) => {
    if (el) rowEls.current[id] = el;
    else delete rowEls.current[id];
  }, []);

  /* ---------- canvas setup ---------- */
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = card.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas, width]);

  /* ---------- physics loop ---------- */
  const consume = useCallback(
    (p) => {
      const h = hole.current;
      h.mass += 1 / Math.max(1, particlesPerItem);
      h.r = 26 * (1 + 0.06 * Math.log(1 + h.mass));
      h.flashes.push({ progress: 0 });
      const idx = particles.current.indexOf(p);
      if (idx >= 0) particles.current.splice(idx, 1);
    },
    [particlesPerItem],
  );

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const now = performance.now();
    if (!tick.last) tick.last = now;
    const dt = Math.min((now - tick.last) / 1000, 1 / 30);
    tick.last = now;

    const h = hole.current;
    const G = gravity * h.mass;
    const rect = cardRef.current.getBoundingClientRect();

    // Advance particles.
    for (const p of particles.current) {
      const dx = h.x - p.x;
      const dy = h.y - p.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < h.r) {
        consume(p);
        continue;
      }
      const a = Math.min(G / (r * r), 9000);
      const ax = (dx / r) * a;
      const ay = (dy / r) * a;
      const drag = Math.pow(0.72, dt);
      p.vx = (p.vx + ax * dt) * drag;
      p.vy = (p.vy + ay * dt) * drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Advance flashes.
    h.flashes = h.flashes.filter((f) => (f.progress += dt / 0.5) < 1);
    h.angle += dt * 1.4;

    // ---------- draw ----------
    ctx.clearRect(0, 0, rect.width, rect.height);

    const { x, y, r } = h;

    // Feeding glow when particles are around.
    if (particles.current.length > 0) {
      const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 5);
      glow.addColorStop(0, rgba(color, 0.22));
      glow.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swirling mouth.
    if (phase !== 'idle') {
      const swirlR = r * 0.85;
      const grad = ctx.createConicGradient(h.angle, x, y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.1, color);
      grad.addColorStop(0.25, 'transparent');
      grad.addColorStop(0.4, color);
      grad.addColorStop(0.55, 'transparent');
      grad.addColorStop(0.7, color);
      grad.addColorStop(0.85, 'transparent');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, swirlR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core + horizon.
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Consumption flashes.
    for (const f of h.flashes) {
      ctx.strokeStyle = rgba(color, 0.7 * (1 - f.progress));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + f.progress * 46, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles as accretion streaks.
    for (const p of particles.current) {
      const dx = x - p.x;
      const dy = y - p.y;
      const r2 = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.max(0, Math.min(1, (r2 - h.r) / 26));
      const k = 0.018;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * k, p.y - p.vy * k);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (particles.current.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (phase === 'consuming') {
      rafRef.current = null;
      tick.last = 0;
      finishConsuming();
    }
  }, [gravity, color, phase, consume]);

  const finishConsuming = useCallback(() => {
    setPhase('done');
    setDissolving([]);
    setSelected((prev) => {
      const consumed = prev
        .map((id) => list.find((it) => it.id === id))
        .filter(Boolean);
      onDelete?.(consumed);
      const next = list.filter((it) => !prev.includes(it.id));
      setList(next);
      onItemsChange?.(next);
      return [];
    });
  }, [list, onDelete, onItemsChange]);

  /* ---------- spawning ---------- */
  const spawnParticles = useCallback(
    (rect, item) => {
      const h = hole.current;
      const count = Math.max(1, Math.floor(particlesPerItem));
      for (let i = 0; i < count; i++) {
        const px = rect.x + Math.random() * rect.w;
        const py = rect.y + Math.random() * rect.h;
        const dx = h.x - px;
        const dy = h.y - py;
        const r = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const v = Math.sqrt((gravity * h.mass) / r) * spin;
        const tx = -dy / r;
        const ty = dx / r;
        const vx = (tx * v + (dx / r) * -0.15 * v) * (0.85 + Math.random() * 0.3);
        const vy = (ty * v + (dy / r) * -0.15 * v) * (0.85 + Math.random() * 0.3);
        const roll = Math.random();
        const palette =
          roll < 0.5 ? color : roll < 0.8 ? '#fff3e0' : rgba(color, 0.55);
        particles.current.push({
          x: px,
          y: py,
          vx,
          vy,
          size: 2 + Math.random() * 3,
          color: roll < 0.2 ? kindColor(item.kind, color) : palette,
        });
      }
    },
    [gravity, spin, particlesPerItem, color],
  );

  /* ---------- flow ---------- */
  const startConsuming = useCallback(() => {
    if (phase === 'consuming' || phase === 'transforming') return;
    if (selected.length === 0) return;
    setPhase('consuming');
    const targets = selected.slice();
    targets.forEach((id, i) => {
      const timer = setTimeout(() => {
        const item = list.find((it) => it.id === id);
        const el = rowEls.current[id];
        if (!item || !el) return;
        const cardRect = cardRef.current.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        spawnParticles(
          { x: r.left - cardRect.left, y: r.top - cardRect.top, w: r.width, h: r.height },
          item,
        );
        setDissolving((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }, i * 140);
      dissolveTimers.current.push(timer);
    });
    tick.last = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [phase, selected, list, spawnParticles, tick]);

  const triggerTransform = useCallback(() => {
    if (phase !== 'idle') return;
    if (selected.length === 0) {
      if (trashRef.current) {
        trashRef.current.classList.remove('shake');
        void trashRef.current.offsetWidth; // restart animation
        trashRef.current.classList.add('shake');
      }
      return;
    }
    setPhase('transforming');
    // Measure the trash position for the hole.
    const trash = trashRef.current;
    const cardRect = cardRef.current.getBoundingClientRect();
    const tr = trash.getBoundingClientRect();
    hole.current.x = tr.left - cardRect.left + tr.width / 2;
    hole.current.y = tr.top - cardRect.top + tr.height / 2;
    setTimeout(startConsuming, 520);
  }, [phase, selected, startConsuming]);

  const handleTriggerPress = useCallback(() => {
    if (phase === 'idle') triggerTransform();
    else if (phase === 'done') startConsuming();
  }, [phase, triggerTransform, startConsuming]);

  /* ---------- imperative handle (demo helper) ---------- */
  useImperativeHandle(
    ref,
    () => ({
      selectAll: () => setSelected(list.map((it) => it.id)),
      clearSelection: () => setSelected([]),
    }),
    [list],
  );

  /* ---------- selection ---------- */
  const toggleSelect = useCallback(
    (id) => {
      if (phase === 'consuming' || phase === 'transforming') return;
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [phase],
  );

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      dissolveTimers.current.forEach(clearTimeout);
    };
  }, []);

  /* ---------- render ---------- */
  const armed = phase !== 'consuming' && phase !== 'transforming' && selected.length > 0;
  const holeVisible = phase !== 'idle';

  return (
    <div className={`bht-card ${className}`} ref={cardRef} style={{ '--rim': color }}>
      <div className="bht-header">
        <span className="bht-title">Files</span>
        <span className="bht-count">
          {list.length} files{selected.length > 0 ? ` · ${selected.length} selected` : ''}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="bht-empty">No files</div>
      ) : (
        list.map((item) => {
          const isSel = selected.includes(item.id);
          const isDissolving = dissolving.includes(item.id);
          return (
            <div
              key={item.id}
              className={`bht-row ${isSel ? 'bht-row--sel' : ''} ${isDissolving ? 'bht-row--dissolve' : ''}`}
              ref={setRowRef(item.id)}
              onClick={() => toggleSelect(item.id)}
            >
              <span className={`bht-check ${isSel ? 'on' : ''}`}>{isSel ? '✓' : ''}</span>
              <span
                className="bht-icon"
                style={{ background: rgba(kindColor(item.kind, color), 0.16) }}
              >
                {kindIcon(item.kind)}
              </span>
              <span className="bht-rowtext">
                <span className="bht-name">{item.name}</span>
                {item.meta ? <span className="bht-meta">{item.meta}</span> : null}
              </span>
            </div>
          );
        })
      )}

      {/* Trigger area: trash icon (idle) or black hole tap target */}
      <div className="bht-trigger-anchor">
        {phase === 'idle' ? (
          <button
            ref={trashRef}
            className={`bht-trash ${armed ? 'armed' : ''}`}
            onClick={handleTriggerPress}
            aria-label="Trash — turns into a black hole"
          >
            🗑️
          </button>
        ) : (
          <button
            ref={holeBtnRef}
            className={`bht-hole-btn ${phase === 'done' && armed ? 'armed' : ''}`}
            onClick={handleTriggerPress}
            disabled={phase === 'consuming' || phase === 'transforming'}
            aria-label="Black hole — tap to consume selected files"
          >
            <span className="bht-hole-pulse" />
          </button>
        )}
        {armed ? <span className="bht-armed-hint">Tap the void to consume</span> : null}
      </div>

      {/* Physics canvas */}
      <canvas ref={canvasRef} className="bht-canvas" />
    </div>
  );
});
