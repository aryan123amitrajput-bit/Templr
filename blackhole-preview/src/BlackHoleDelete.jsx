/**
 * BlackHoleDelete — Web twin of the React Native replica.
 *
 * Same prop contract as the RN component (see /BlackHoleDelete.tsx) so the
 * behavior can be previewed and tweaked in a browser:
 *
 *  - Tapping the trash button makes the row fall into the black hole:
 *    translate down, wind around the hole (`spin` radians), shrink and
 *    fade, shedding `particles` debris.
 *  - Rapid successive deletes cascade with `stagger` seconds between starts.
 *  - The bin has a glowing rim in `color`, a swirling mouth and orbits
 *    heated debris; it pulses each time an item is consumed.
 *  - When `undo` is on, a snackbar offers Undo. With `undoSwirl` items
 *    swirl back out of the bin in reverse; otherwise rows fade back in.
 *  - Controlled (`items` + `onItemsChange`) or uncontrolled
 *    (`defaultItems`). Deletions report through `onDelete`.
 *
 * Icons: proper SVG outline icons (24x24, stroke 1.75, round joins) matching
 * the official uibrik site's icon style — no emojis anywhere.
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

/* ------------------------------------------------------------------ *
 * SVG icons — outline style matching the official uibrik icon set:
 * 24x24 viewBox, stroke=currentColor, stroke-width 1.75, round caps.
 * ------------------------------------------------------------------ */

function Svg({ size = 18, stroke = 1.75, children, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SlidesIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M10 9.4l4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none" />
      <path d="M8.5 20.5h7" />
    </Svg>
  );
}

function PdfIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 2.5h6.2L18 7.1v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2z" />
      <path d="M12.2 2.5V7.1H18" />
      <path d="M8 12.2h5.2M8 15.4h3.2" />
    </Svg>
  );
}

function ImageIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="M4 17l5-4.5 3.4 3 2.8-2.4 4.8 3.9" />
    </Svg>
  );
}

function ArchiveIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="4.5" rx="1.2" />
      <path d="M5.5 8.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5" />
      <path d="M10 12.2h4" />
    </Svg>
  );
}

function TextIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 2.5h6.2L18 7.1v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2z" />
      <path d="M12.2 2.5V7.1H18" />
      <path d="M8 11.2h8M8 14.4h8M8 17.6h5" />
    </Svg>
  );
}

function TrashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3.8 6.2h16.4M9.2 6.2V4.6a1.6 1.6 0 0 1 1.6-1.6h2.4a1.6 1.6 0 0 1 1.6 1.6v1.6" />
      <path d="M18.4 6.2l-.85 13a2 2 0 0 1-2 1.9H8.45a2 2 0 0 1-2-1.9L5.6 6.2" />
      <path d="M10.2 10.6v5.8M13.8 10.6v5.8" />
    </Svg>
  );
}

function LoadingIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Svg>
  );
}

const KIND_ICON = {
  slides: SlidesIcon,
  pdf: PdfIcon,
  image: ImageIcon,
  archive: ArchiveIcon,
  text: TextIcon,
};

const KIND_COLOR = {
  slides: '#f59e0b',
  pdf: '#ef4444',
  image: '#a855f7',
  archive: '#64748b',
  text: '#3b82f6',
};

function KindIcon({ kind, size = 17 }) {
  const Cmp = KIND_ICON[kind] || TextIcon;
  return <Cmp size={size} />;
}

function kindColor(kind, fallback = '#64748b') {
  return (KIND_COLOR[kind] || fallback);
}

function rgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function RowInner({ item, color }) {
  const ic = kindColor(item.kind, color);
  return (
    <>
      <span
        className="bhd-icon"
        style={{ background: rgba(ic, 0.14), color: ic }}
      >
        <KindIcon kind={item.kind} />
      </span>
      <span className="bhd-rowtext">
        <span className="bhd-name">{item.name}</span>
        {item.meta ? <span className="bhd-meta">{item.meta}</span> : null}
      </span>
    </>
  );
}

export default forwardRef(function BlackHoleDelete(props, ref) {
  const {
    color = '#ff8a3d',
    duration = 1.1,
    stagger = 0.09,
    particles = 160,
    spin = 2.4,
    undo = true,
    undoSwirl = false,
    width = 380,
    items: controlled,
    defaultItems = SAMPLE_FILES,
    onItemsChange,
    onDelete,
    className = '',
  } = props;

  const isControlled = controlled !== undefined;
  const [list, setList] = useState(isControlled ? controlled : defaultItems);

  useEffect(() => {
    if (isControlled) {
      setList(controlled);
      setShowUndo(false);
      undoBatchRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled]);

  /* ---------- geometry refs ---------- */
  const cardRef = useRef(null);
  const binRef = useRef(null);
  const rowEls = useRef({});
  const fallingRects = useRef({});

  const setRowRef = useCallback((id) => (el) => {
    if (el) rowEls.current[id] = el;
    else delete rowEls.current[id];
  }, []);

  const measure = useCallback(() => {
    const card = cardRef.current;
    if (!card) return null;
    const cardRect = card.getBoundingClientRect();
    const binRect = binRef.current ? binRef.current.getBoundingClientRect() : null;
    return {
      cardRect,
      binCenterY:
        binRect !== null
          ? binRect.top - cardRect.top + binRect.height / 2
          : null,
    };
  }, []);

  /* ---------- selection ---------- */
  const [selected, setSelected] = useState(() => new Set());
  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === list.length ? new Set() : new Set(list.map((it) => it.id)),
    );
  }, [list]);

  /* ---------- overlay / particles / undo state ---------- */
  const [overlay, setOverlay] = useState([]);
  const [particleLayer, setParticleLayer] = useState([]);
  const [showUndo, setShowUndo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [fadingIds, setFadingIds] = useState([]);
  const [pulseKey, setPulseKey] = useState(0);

  const undoTimer = useRef(null);
  const undoBatchRef = useRef([]); // { item, index, rect }
  const restoringSnapshotRef = useRef([]);
  const restoringRemaining = useRef(0);
  const fallingCount = useRef(0);
  const queue = useRef([]);
  const particleCounter = useRef(0);

  const spinDeg = spin * (180 / Math.PI);

  /* ---------- particles ---------- */
  const spawnParticles = useCallback(
    (rect, fromColor) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const spread = Math.max(rect.w, 90);
      const count = Math.max(1, Math.floor(particles));
      const next = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * (0.25 + Math.random() * 0.75);
        const roll = Math.random();
        const palette =
          roll < 0.5 ? fromColor : roll < 0.8 ? '#fff3e0' : rgba(fromColor, 0.55);
        next.push({
          key: `p${particleCounter.current++}`,
          x: cx,
          y: cy,
          size: 2 + Math.random() * 3,
          color: palette,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist + rect.h * 0.4,
          rot: (Math.random() - 0.5) * 540,
        });
      }
      setParticleLayer((prev) => [...prev, ...next]);
    },
    [particles],
  );

  /* ---------- deletion pipeline ---------- */
  const finalizeBatch = useCallback(() => {
    const batch = undoBatchRef.current.slice();
    undoBatchRef.current = [];
    if (batch.length === 0) return;

    const deleted = batch.map((b) => b.item);
    const ids = deleted.map((d) => d.id);
    const nextList = list.filter((it) => !ids.includes(it.id));
    setList(nextList);

    deleted.forEach((_, i) => {
      setTimeout(() => setPulseKey((k) => k + 1), i * 90);
    });

    onDelete?.(deleted);
    onItemsChange?.(nextList);

    if (undo) {
      setUndoCount(deleted.length);
      setShowUndo(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setShowUndo(false), 6000);
    }
  }, [list, onDelete, onItemsChange, undo]);

  const startFall = useCallback(
    (entry, cascadeOffset) => {
      const item = list.find((it) => it.id === entry.id);
      if (!item) return;
      const m = measure();
      const el = rowEls.current[entry.id];
      let rect = { x: 0, y: 0, w: width, h: 48 };
      if (el && m) {
        const r = el.getBoundingClientRect();
        rect = {
          x: r.left - m.cardRect.left,
          y: r.top - m.cardRect.top,
          w: r.width,
          h: r.height,
        };
      }
      const fallDist =
        m && m.binCenterY !== null
          ? Math.max(m.binCenterY - (rect.y + rect.h / 2), rect.h * 2)
          : rect.h * 2;

      fallingRects.current[entry.id] = rect;

      setOverlay((prev) => [
        ...prev,
        {
          id: entry.id,
          item,
          rect,
          fallDist,
          delayMs: Math.round(cascadeOffset * stagger * 1000),
          kind: 'falling',
        },
      ]);
      fallingCount.current += 1;

      setTimeout(
        () => spawnParticles(rect, color),
        Math.min(cascadeOffset * stagger * 1000, 120),
      );
    },
    [list, measure, width, stagger, color, spawnParticles],
  );

  const processQueue = useCallback(() => {
    if (queue.current.length === 0) return;
    const next = queue.current.shift();
    const cascadeOffset = undoBatchRef.current.length + fallingCount.current;
    startFall(next, cascadeOffset);
  }, [startFall]);

  const handleFallComplete = useCallback(
    (id) => {
      setOverlay((prev) => prev.filter((o) => !(o.kind === 'falling' && o.id === id)));
      fallingCount.current = Math.max(0, fallingCount.current - 1);

      const item = list.find((it) => it.id === id);
      const rect = fallingRects.current[id];
      delete fallingRects.current[id];
      if (item) {
        undoBatchRef.current.push({
          item,
          index: list.findIndex((it) => it.id === id),
          rect,
        });
      }

      if (fallingCount.current === 0) {
        finalizeBatch();
      } else {
        processQueue();
      }
    },
    [list, finalizeBatch, processQueue],
  );

  const requestDelete = useCallback(
    (id) => {
      if (queue.current.some((q) => q.id === id)) return;
      if (undoBatchRef.current.some((b) => b.item.id === id)) return;
      const index = list.findIndex((it) => it.id === id);
      if (index < 0) return;
      queue.current.push({ id, index });
      processQueue();
    },
    [list, processQueue],
  );

  const deleteSelected = useCallback(() => {
    list.forEach((it) => {
      if (selected.has(it.id)) requestDelete(it.id);
    });
  }, [list, selected, requestDelete]);

  /* ---------- undo ---------- */
  const restoreItems = useCallback(
    (batch) => {
      const next = [...list];
      batch
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((b) => next.splice(Math.min(b.index, next.length), 0, b.item));
      setList(next);
      onItemsChange?.(next);
    },
    [list, onItemsChange],
  );

  const handleRestoreComplete = useCallback(
    (id) => {
      setOverlay((prev) => prev.filter((o) => !(o.kind === 'restoring' && o.id === id)));
      restoringRemaining.current = Math.max(0, restoringRemaining.current - 1);
      if (restoringRemaining.current === 0) {
        const snapshot = restoringSnapshotRef.current.slice();
        restoringSnapshotRef.current = [];
        restoreItems(snapshot);
      }
    },
    [restoreItems],
  );

  const doUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const batch = undoBatchRef.current.slice();
    undoBatchRef.current = [];
    setShowUndo(false);
    if (batch.length === 0) return;

    if (!undoSwirl) {
      restoreItems(batch);
      const ids = batch.map((b) => b.item.id);
      setFadingIds(ids);
      ids.forEach((id) => {
        setTimeout(() => setFadingIds((prev) => prev.filter((x) => x !== id)), 450);
      });
      return;
    }

    restoringRemaining.current = batch.length;
    restoringSnapshotRef.current = batch;
    batch.forEach((b) => {
      const rect =
        b.rect ?? fallingRects.current[b.item.id] ?? { x: 0, y: 0, w: width, h: 48 };
      const m = measure();
      const dist =
        m && m.binCenterY !== null
          ? Math.max(m.binCenterY - (rect.y + rect.h / 2), rect.h * 2)
          : rect.h * 2;
      setOverlay((prev) => [
        ...prev,
        { id: b.item.id, item: b.item, rect, fallDist: dist, delayMs: 0, kind: 'restoring' },
      ]);
    });
  }, [undoSwirl, restoreItems, width, measure]);

  /* ---------- imperative handle (demo helper) ---------- */
  useImperativeHandle(
    ref,
    () => ({
      deleteAll: () => {
        list.forEach((it, i) => queue.current.push({ id: it.id, index: i }));
        processQueue();
      },
    }),
    [list, processQueue],
  );

  /* ---------- render ---------- */
  return (
    <div className={`bhd-card ${className}`} ref={cardRef} style={{ '--rim': color }}>
      <div className="bhd-header">
        <span className="bhd-title">Files</span>
        <span className="bhd-count">{list.length} files</span>
      </div>

      {list.length === 0 ? (
        <div className="bhd-empty">No files</div>
      ) : (
        <>
          <div className="bhd-toolbar">
            <button
              type="button"
              className="bhd-selectall"
              onClick={selectAll}
            >
              {selected.size === list.length && list.length > 0 ? 'Clear' : 'Select all'}
            </button>
            <button
              type="button"
              className="bhd-deletesel"
              onClick={deleteSelected}
              disabled={selected.size === 0}
              style={{ '--rim': color }}
            >
              <TrashIcon size={15} />
              Delete{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
          {list.map((item) => {
            const pending =
              queue.current.some((q) => q.id === item.id) ||
              undoBatchRef.current.some((b) => b.item.id === item.id);
            const isSel = selected.has(item.id);
            return (
              <div
                key={item.id}
                className={`bhd-row ${fadingIds.includes(item.id) ? 'bhd-row--fade' : ''} ${
                  isSel ? 'bhd-row--selected' : ''
                }`}
                ref={setRowRef(item.id)}
              >
                <button
                  type="button"
                  className={`bhd-check ${isSel ? 'bhd-check--on' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                  aria-pressed={isSel}
                  aria-label={isSel ? `Deselect ${item.name}` : `Select ${item.name}`}
                >
                  {isSel ? (
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  ) : null}
                </button>
                <RowInner item={item} color={color} />
                <button
                  className="bhd-delete"
                  onClick={() => requestDelete(item.id)}
                  disabled={pending}
                  aria-label={`Delete ${item.name}`}
                >
                  {pending ? <LoadingIcon size={16} className="bhd-spin" /> : <TrashIcon size={16} />}
                </button>
              </div>
            );
          })}
        </>
      )}

      <div className="bhd-bin-anchor">
        <div key={pulseKey} className="bhd-bin" ref={binRef}>
          <div className="bhd-bin__swirl" />
          <div className="bhd-bin__core" />
          <div className="bhd-bin__orbit">
            {Array.from({ length: 10 }, (_, i) => {
              const size = 2 + (i % 3);
              return (
                <span
                  key={i}
                  className="bhd-debris-wrap"
                  style={{ transform: `rotate(${(i / 10) * 360}deg)` }}
                >
                  <span
                    className="bhd-debris"
                    style={{
                      width: size,
                      height: size,
                      marginLeft: -size / 2,
                      background: i % 3 === 0 ? '#fff3e0' : color,
                    }}
                  />
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Falling / restoring overlay */}
      <div className="bhd-overlay">
        {overlay.map((entry) => (
          <div
            key={entry.kind === 'falling' ? entry.id : `restoring:${entry.id}`}
            className="bhd-overlay-row"
            style={{
              left: entry.rect.x,
              top: entry.rect.y,
              width: entry.rect.w,
              height: entry.rect.h,
              '--dist': `${entry.fallDist}px`,
              '--spin': `${spinDeg}deg`,
              animation: `bhd-${entry.kind === 'falling' ? 'fall' : 'swirl-out'} ${duration}s ${{
                'falling': 'cubic-bezier(.42,0,.7,.4)',
                'restoring': 'cubic-bezier(.2,.8,.3,1)',
              }[entry.kind]} both`,
              animationDelay: `${entry.delayMs}ms`,
            }}
            onAnimationEnd={() =>
              entry.kind === 'falling'
                ? handleFallComplete(entry.id)
                : handleRestoreComplete(entry.id)
            }
          >
            <RowInner item={entry.item} color={color} />
          </div>
        ))}
      </div>

      {/* Particle layer */}
      <div className="bhd-overlay">
        {particleLayer.map((p) => (
          <span
            key={p.key}
            className="bhd-particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
              animation: `bhd-particle ${duration}s cubic-bezier(.2,.6,.4,1) both`,
            }}
            onAnimationEnd={() =>
              setParticleLayer((prev) => prev.filter((q) => q.key !== p.key))
            }
          />
        ))}
      </div>

      {/* Undo snackbar */}
      {showUndo ? (
        <div className="bhd-snackbar">
          <span className="bhd-snack-text">
            Deleted {undoCount} {undoCount === 1 ? 'file' : 'files'}
          </span>
          <button className="bhd-undo" style={{ color }} onClick={doUndo}>
            Undo
          </button>
        </div>
      ) : null}
    </div>
  );
});
