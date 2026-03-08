import React, { useMemo, useState } from 'react';

type BurstHeart = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  size: number;
  delay: number;
};

const HEART_COLORS = ['#ff4d8d', '#ff6fa5', '#ff8fb8', '#ff3f7a', '#ff9ec5'];

const App: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);

  const burstHearts = useMemo<BurstHeart[]>(() => {
    return Array.from({ length: 14 }, (_, index) => ({
      id: index,
      x: Math.cos((index / 14) * Math.PI * 2) * (78 + (index % 3) * 12),
      y: Math.sin((index / 14) * Math.PI * 2) * (78 + ((index + 1) % 3) * 10),
      rotate: -20 + index * 6,
      size: 14 + (index % 4) * 3,
      delay: index * 18,
    }));
  }, []);

  const onToggleLike = () => {
    setLiked((prev) => !prev);
    setPulseTick((prev) => prev + 1);
  };

  return (
    <main className="stage">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; height: 100%; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

        .stage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 100, 170, 0.2), transparent 40%),
            radial-gradient(circle at 80% 10%, rgba(148, 61, 255, 0.16), transparent 34%),
            radial-gradient(circle at 50% 100%, rgba(255, 72, 131, 0.18), transparent 42%),
            #000;
          overflow: hidden;
        }

        .like-wrap {
          position: relative;
          width: 220px;
          height: 220px;
          display: grid;
          place-items: center;
        }

        .ring {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 999px;
          border: 1.5px solid rgba(255, 140, 185, 0.4);
          animation: ringPulse 2.8s ease-out infinite;
          filter: drop-shadow(0 0 14px rgba(255, 95, 160, 0.5));
        }

        .ring.two { width: 168px; height: 168px; animation-delay: 0.4s; opacity: 0.7; }
        .ring.three { width: 196px; height: 196px; animation-delay: 0.8s; opacity: 0.5; }

        .like-btn {
          position: relative;
          width: 120px;
          height: 120px;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          background: linear-gradient(160deg, #2d0f1f, #190510);
          box-shadow:
            0 20px 36px rgba(0, 0, 0, 0.7),
            inset 0 2px 10px rgba(255, 255, 255, 0.08),
            inset 0 -6px 14px rgba(0, 0, 0, 0.55);
          transform: translateZ(0);
          transition: transform 230ms cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 230ms ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .like-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow:
            0 24px 44px rgba(0, 0, 0, 0.76),
            0 0 26px rgba(255, 75, 145, 0.38),
            inset 0 2px 10px rgba(255, 255, 255, 0.1),
            inset 0 -6px 14px rgba(0, 0, 0, 0.5);
        }

        .like-btn:active { transform: translateY(0) scale(0.95); }

        .heart {
          width: 56px;
          height: 56px;
          color: #fd95be;
          filter: drop-shadow(0 2px 10px rgba(255, 88, 153, 0.36));
          transition: transform 320ms cubic-bezier(0.17, 0.89, 0.32, 1.28), color 240ms ease, filter 240ms ease;
        }

        .liked .heart {
          color: #ff3b82;
          transform: scale(1.18);
          filter: drop-shadow(0 0 18px rgba(255, 65, 142, 0.9));
          animation: heartBeat 560ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .pulse-overlay {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 999px;
          pointer-events: none;
          border: 2px solid rgba(255, 79, 148, 0.72);
          animation: burstRing 680ms ease-out forwards;
        }

        .burst {
          position: absolute;
          pointer-events: none;
          opacity: 0;
        }

        .liked .burst {
          animation: flyOut 760ms cubic-bezier(0.2, 0.75, 0.2, 1) forwards;
          animation-delay: var(--delay);
        }

        @keyframes heartBeat {
          0% { transform: scale(0.85); }
          35% { transform: scale(1.25); }
          55% { transform: scale(1.08); }
          100% { transform: scale(1.18); }
        }

        @keyframes ringPulse {
          0% { transform: scale(0.86); opacity: 0; }
          40% { opacity: 0.62; }
          100% { transform: scale(1.13); opacity: 0; }
        }

        @keyframes flyOut {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.7) rotate(0deg);
          }
          20% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0.2) rotate(var(--rotate));
          }
        }

        @keyframes burstRing {
          from { transform: scale(0.8); opacity: 0.95; }
          to { transform: scale(1.7); opacity: 0; }
        }
      `}</style>

      <section className={`like-wrap ${liked ? 'liked' : ''}`}>
        <span className="ring" />
        <span className="ring two" />
        <span className="ring three" />

        <button className="like-btn" onClick={onToggleLike} aria-label="Like">
          <svg viewBox="0 0 24 24" fill="currentColor" className="heart" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        <div key={pulseTick} className="pulse-overlay" />

        {burstHearts.map((item) => (
          <svg
            key={`${pulseTick}-${item.id}`}
            className="burst"
            viewBox="0 0 24 24"
            fill={HEART_COLORS[item.id % HEART_COLORS.length]}
            width={item.size}
            height={item.size}
            style={{
              ['--x' as string]: `${item.x}px`,
              ['--y' as string]: `${item.y}px`,
              ['--rotate' as string]: `${item.rotate}deg`,
              ['--delay' as string]: `${item.delay}ms`,
            }}
            aria-hidden="true"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ))}
      </section>
    </main>
  );
};

export default App;
