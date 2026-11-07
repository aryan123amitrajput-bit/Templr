import React, { useEffect, useRef, useState } from 'react';
import BlackHoleDelete from './BlackHoleDelete.jsx';
import BlackHoleTrash from './BlackHoleTrash.jsx';

const PRESETS = [
  '#ff8a3d',
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#e5e5e5',
];

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const trash = route.startsWith('#/trash');

  return (
    <div className="page">
      <header className="hero">
        <h1>
          Black Hole <span className="accent">Delete</span>
        </h1>
        <p className="sub">
          Replica of uibrik’s Pro component — live web twin + drop-in React Native
          implementation (<code>/BlackHoleDelete.tsx</code>).
        </p>
      </header>

      <nav className="nav">
        <a
          className={`nav-btn ${!trash ? 'on' : ''}`}
          href="#/"
        >
          BlackHole Delete (fall effect)
        </a>
        <a
          className={`nav-btn ${trash ? 'on' : ''}`}
          href="#/trash"
        >
          Select → Black Hole (physics)
        </a>
      </nav>

      {trash ? <TrashDemo /> : <DeleteDemo />}

      <footer className="footer">
        React Native: <code>/BlackHoleDelete.tsx</code> + <code>/BlackHoleTrash.tsx</code> ·
        web twins: <code>blackhole-preview/src/</code>
      </footer>
    </div>
  );
}

/* ---------------- Page 1: the fall-effect demo ---------------- */

function DeleteDemo() {
  const [cfg, setCfg] = useState({
    color: '#ff8a3d',
    duration: 1.1,
    stagger: 0.09,
    particles: 160,
    spin: 2.4,
    undo: true,
    undoSwirl: false,
    width: 380,
  });
  const [resetKey, setResetKey] = useState(0);
  const [log, setLog] = useState([]);
  const bhdRef = useRef(null);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const handleDelete = (deleted) => {
    setLog((l) =>
      [
        { t: 'onDelete', m: deleted.map((d) => d.name).join(', ') },
        ...l,
      ].slice(0, 8),
    );
  };

  const handleItemsChange = (items) => {
    setLog((l) =>
      [{ t: 'onItemsChange', m: `${items.length} items remain` }, ...l].slice(0, 8),
    );
  };

  return (
    <div className="layout">
      <section className="col-main">
        <BlackHoleDelete
          ref={bhdRef}
          key={resetKey}
          {...cfg}
          onDelete={handleDelete}
          onItemsChange={handleItemsChange}
        />

        <div className="demo-actions">
          <button className="btn btn-ghost" onClick={() => bhdRef.current?.deleteAll()}>
            Delete all (stagger cascade)
          </button>
          <button className="btn btn-ghost" onClick={() => setResetKey((k) => k + 1)}>
            Reset
          </button>
        </div>

        <div className="log">
          <div className="log-title">Live callback evidence</div>
          {log.length === 0 ? (
            <div className="log-empty">Delete a file to see onDelete / onItemsChange fire…</div>
          ) : (
            log.map((e, i) => (
              <div key={i} className="log-row">
                <span className={`log-tag ${e.t}`}>{e.t}</span>
                <span>{e.m}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="col-side">
        <div className="panel">
          <div className="panel-title">Customize</div>

          <label className="ctrl">
            <span className="ctrl-label">
              Color <code>#{cfg.color.replace('#', '')}</code>
            </span>
            <span className="ctrl-presets">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${cfg.color.toLowerCase() === c ? 'on' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                  aria-label={`color ${c}`}
                />
              ))}
              <input
                type="color"
                value={cfg.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </span>
          </label>

          <Slider label="Duration (s)" value={cfg.duration} min={0.2} max={3} step={0.1} onChange={(v) => set('duration', v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="Stagger (s)" value={cfg.stagger} min={0} max={0.5} step={0.01} onChange={(v) => set('stagger', v)} fmt={(v) => v.toFixed(2)} />
          <Slider label="Particles" value={cfg.particles} min={0} max={300} step={10} onChange={(v) => set('particles', v)} fmt={(v) => String(v)} />
          <Slider label="Spin (radians)" value={cfg.spin} min={0} max={8} step={0.1} onChange={(v) => set('spin', v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="Width (px)" value={cfg.width} min={300} max={520} step={10} onChange={(v) => set('width', v)} fmt={(v) => String(v)} />

          <label className="ctrl ctrl-check">
            <input type="checkbox" checked={cfg.undo} onChange={(e) => set('undo', e.target.checked)} />
            <span>Undo (offer an Undo after deleting)</span>
          </label>
          <label className="ctrl ctrl-check">
            <input type="checkbox" checked={cfg.undoSwirl} onChange={(e) => set('undoSwirl', e.target.checked)} />
            <span>Undo swirl (items swirl back out of the bin)</span>
          </label>
        </div>

        <div className="panel">
          <div className="panel-title">How the original works</div>
          <ul className="evidence">
            <li>A card lists files; each row shows a kind icon, name, meta and a delete button.</li>
            <li>
              Deleting makes the row fall into a black-hole bin fixed at the bottom:
              translate down, wind around the hole (<code>spin</code> radians), shrink,
              fade — shedding <code>particles</code> debris.
            </li>
            <li>Rapid successive deletes cascade with <code>stagger</code> seconds between starts.</li>
            <li>
              The bin has a glowing rim in <code>color</code>, a swirling mouth and orbits
              heated debris; it pulses as items are consumed.
            </li>
            <li>
              With <code>undo</code> a snackbar offers Undo. <code>undoSwirl</code> replays
              the delete backwards (items swirl out of the bin); otherwise rows fade back in.
            </li>
            <li>
              Controlled via <code>items</code> + <code>onItemsChange</code>, or
              uncontrolled via <code>defaultItems</code>; deletions report through{' '}
              <code>onDelete</code>.
            </li>
          </ul>
          <p className="note">
            Evidence basis: uibrik’s public component docs and the free live preview. The
            source is Pro-gated, so exact internals are reconstructed from the documented
            prop contract — the behaviors above are the contract, faithfully implemented in
            both the RN component and this web twin.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Page 2: the select → black hole demo ---------------- */

function TrashDemo() {
  const [cfg, setCfg] = useState({
    color: '#ff8a3d',
    particlesPerItem: 40,
    gravity: 2.5e7,
    spin: 1,
    width: 380,
  });
  const [resetKey, setResetKey] = useState(0);
  const [log, setLog] = useState([]);
  const bhtRef = useRef(null);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const handleDelete = (deleted) => {
    setLog((l) =>
      [
        {
          t: 'onDelete',
          m: `${deleted.length} consumed: ${deleted.map((d) => d.name).join(', ')}`,
        },
        ...l,
      ].slice(0, 8),
    );
  };

  const handleItemsChange = (items) => {
    setLog((l) =>
      [{ t: 'onItemsChange', m: `${items.length} items remain` }, ...l].slice(0, 8),
    );
  };

  return (
    <div className="layout">
      <section className="col-main">
        <BlackHoleTrash
          ref={bhtRef}
          key={resetKey}
          {...cfg}
          onDelete={handleDelete}
          onItemsChange={handleItemsChange}
        />

        <div className="demo-actions">
          <button className="btn btn-ghost" onClick={() => bhtRef.current?.selectAll()}>
            Select all
          </button>
          <button className="btn btn-ghost" onClick={() => setResetKey((k) => k + 1)}>
            Reset
          </button>
        </div>

        <div className="log">
          <div className="log-title">Live callback evidence</div>
          {log.length === 0 ? (
            <div className="log-empty">
              Select files, tap the trash icon, watch the void eat them…
            </div>
          ) : (
            log.map((e, i) => (
              <div key={i} className="log-row">
                <span className={`log-tag ${e.t}`}>{e.t}</span>
                <span>{e.m}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="col-side">
        <div className="panel">
          <div className="panel-title">Customize</div>

          <label className="ctrl">
            <span className="ctrl-label">
              Color <code>#{cfg.color.replace('#', '')}</code>
            </span>
            <span className="ctrl-presets">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${cfg.color.toLowerCase() === c ? 'on' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                  aria-label={`color ${c}`}
                />
              ))}
              <input
                type="color"
                value={cfg.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </span>
          </label>

          <Slider
            label="Particles / item"
            value={cfg.particlesPerItem}
            min={10}
            max={120}
            step={5}
            onChange={(v) => set('particlesPerItem', v)}
            fmt={(v) => String(v)}
          />
          <Slider
            label="Gravity (×10⁷)"
            value={cfg.gravity / 1e7}
            min={0.5}
            max={8}
            step={0.1}
            onChange={(v) => set('gravity', v * 1e7)}
            fmt={(v) => v.toFixed(1)}
          />
          <Slider
            label="Spin (orbital speed)"
            value={cfg.spin}
            min={0.3}
            max={2.5}
            step={0.1}
            onChange={(v) => set('spin', v)}
            fmt={(v) => v.toFixed(1)}
          />
          <Slider
            label="Width (px)"
            value={cfg.width}
            min={300}
            max={520}
            step={10}
            onChange={(v) => set('width', v)}
            fmt={(v) => String(v)}
          />

          <div className="howto">
            <div className="panel-title" style={{ marginBottom: 8 }}>
              How it works
            </div>
            <ol className="evidence ol">
              <li>Tap rows (or their circles) to select files — the trash icon glows.</li>
              <li>Tap the trash icon: it spins up and dissolves into a black hole.</li>
              <li>
                Each selected file disintegrates into particles with orbital velocity.
              </li>
              <li>
                Real physics: inverse-square gravity pulls them into accretion spirals —
                they accelerate, stretch into streaks, and are consumed at the event
                horizon. The hole flashes and grows with every meal.
              </li>
              <li>The void stays — select more files and tap it again to feed it again.</li>
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <label className="ctrl">
      <span className="ctrl-label">
        {label} <code>{fmt(value)}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
