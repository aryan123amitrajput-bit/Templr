import React, { useMemo, useState } from 'react';

type BurstParticle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  size: number;
  delay: number;
  color: string;
};

const COLORS = ['#ff2f74', '#ff4f8d', '#ff6ba5', '#ff8cc0', '#ffa8d2', '#ffd3e8'];

const App: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const [tick, setTick] = useState(0);

  const particles = useMemo<BurstParticle[]>(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 84 + (i % 4) * 14;

      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: -30 + i * 8,
        size: 10 + (i % 5) * 3,
        delay: i * 14,
        color: COLORS[i % COLORS.length],
      };
    });
  }, []);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setTick((prev) => prev + 1);
  };

  return (
    <main className="screen">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; }

        .screen {
          min-height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 120%, rgba(255, 48, 126, 0.26), transparent 42%),
            radial-gradient(circle at 14% 6%, rgba(255, 104, 170, 0.16), transparent 38%),
            radial-gradient(circle at 88% 8%, rgba(145, 68, 255, 0.16), transparent 36%),
            #000;
        }

        .like-zone {
          position: relative;
          width: 280px;
          height: 280px;
          display: grid;
          place-items: center;
        }

        .halo {
          position: absolute;
          border-radius: 999px;
          border: 1px solid rgba(255, 138, 191, 0.4);
          box-shadow: 0 0 30px rgba(255, 96, 164, 0.28), inset 0 0 26px rgba(255, 96, 164, 0.18);
          animation: haloPulse 3.2s ease-out infinite;
        }

        .halo.h1 { width: 160px; height: 160px; }
        .halo.h2 { width: 198px; height: 198px; animation-delay: 0.55s; opacity: 0.7; }
        .halo.h3 { width: 236px; height: 236px; animation-delay: 1.1s; opacity: 0.45; }

        .like-btn {
          position: relative;
          z-index: 2;
          width: 130px;
          height: 130px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          display: grid;
          place-items: center;
          cursor: pointer;
          background:
            radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.22), transparent 46%),
            linear-gradient(160deg, #311224, #17050f 62%, #0d0308);
          box-shadow:
            0 30px 46px rgba(0, 0, 0, 0.78),
            0 0 34px rgba(255, 70, 145, 0.26),
            inset 0 2px 10px rgba(255, 255, 255, 0.15),
            inset 0 -12px 18px rgba(0, 0, 0, 0.58);
          transition: transform 240ms cubic-bezier(.2,.9,.2,1.2), box-shadow 240ms ease;
        }

        .like-btn:hover {
          transform: translateY(-5px) scale(1.04);
          box-shadow:
            0 34px 58px rgba(0, 0, 0, 0.82),
            0 0 46px rgba(255, 78, 150, 0.42),
            inset 0 2px 10px rgba(255, 255, 255, 0.16),
            inset 0 -12px 18px rgba(0, 0, 0, 0.52);
        }

        .like-btn:active { transform: scale(0.94); }

        .heart {
          display: block;
          width: 62px;
          height: 62px;
          color: #f7a0c7;
          transform-origin: center;
          filter: drop-shadow(0 2px 10px rgba(255, 120, 172, 0.4));
          transition: color 280ms ease, filter 280ms ease;
        }

        .liked .heart {
          color: #ff2c75;
          filter: drop-shadow(0 0 26px rgba(255, 51, 128, 0.95));
          animation: heartbeat 760ms cubic-bezier(.16,.8,.22,1);
        }

        .shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%);
          transform: translateX(-160%) rotate(10deg);
          opacity: 0;
          pointer-events: none;
        }

        .liked .shine { animation: sweep 900ms ease-out; }

        .shockwave {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 999px;
          border: 2px solid rgba(255, 83, 153, 0.86);
          box-shadow: 0 0 40px rgba(255, 83, 153, 0.5);
          animation: shock 720ms cubic-bezier(.2,.8,.2,1) forwards;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          z-index: 3;
          opacity: 0;
          pointer-events: none;
        }

        .liked .particle {
          animation: burst 900ms cubic-bezier(.14,.75,.2,1) forwards;
          animation-delay: var(--delay);
        }

        .particle.spark {
          width: 4px;
          height: 24px;
          border-radius: 999px;
          background: linear-gradient(to top, transparent, var(--color), transparent);
          filter: drop-shadow(0 0 8px var(--color));
        }

        @keyframes heartbeat {
          0% { transform: scale(.78); }
          24% { transform: scale(1.28); }
          46% { transform: scale(.98); }
          66% { transform: scale(1.18); }
          100% { transform: scale(1.12); }
        }

        @keyframes haloPulse {
          0% { opacity: 0; transform: scale(0.86); }
          35% { opacity: .55; }
          100% { opacity: 0; transform: scale(1.16); }
        }

        @keyframes burst {
          0% { opacity: 0; transform: translate(0, 0) scale(.35) rotate(0deg); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(.2) rotate(var(--r)); }
        }

        @keyframes shock {
          from { transform: scale(.72); opacity: 1; }
          to { transform: scale(1.86); opacity: 0; }
        }

        @keyframes sweep {
          0% { transform: translateX(-160%) rotate(10deg); opacity: 0; }
          35% { opacity: .95; }
          100% { transform: translateX(160%) rotate(10deg); opacity: 0; }
        }
      `}</style>

      <section className={`like-zone ${liked ? 'liked' : ''}`}>
        <span className="halo h1" />
        <span className="halo h2" />
        <span className="halo h3" />

        <button className="like-btn" onClick={handleLike} aria-label="Like">
          <svg viewBox="0 0 24 24" fill="currentColor" className="heart" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="shine" />
        </button>

        {tick > 0 && <div key={`shock-${tick}`} className="shockwave" />}

        {particles.map((p) => (
          <React.Fragment key={`${tick}-${p.id}`}>
            <svg
              className="particle"
              viewBox="0 0 24 24"
              fill={p.color}
              width={p.size}
              height={p.size}
              style={{
                ['--x' as string]: `${p.x}px`,
                ['--y' as string]: `${p.y}px`,
                ['--r' as string]: `${p.rotate}deg`,
                ['--delay' as string]: `${p.delay}ms`,
              }}
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>

            <span
              className="particle spark"
              style={{
                ['--x' as string]: `${p.x * 1.1}px`,
                ['--y' as string]: `${p.y * 1.1}px`,
                ['--r' as string]: `${p.rotate + 20}deg`,
                ['--delay' as string]: `${p.delay + 40}ms`,
                ['--color' as string]: p.color,
              }}
              aria-hidden="true"
            />
          </React.Fragment>
        ))}
      </section>
    </main>
  );
};

export default App;
