import React, { useState } from 'react';

const App: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const handleLikeClick = () => {
    setLiked((prev) => !prev);
    setBurstKey((prev) => prev + 1);
  };

  return (
    <div className="like-scene">
      <button
        type="button"
        onClick={handleLikeClick}
        className={`like-button ${liked ? 'is-liked' : ''}`}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike this design' : 'Like this design'}
      >
        <span className="glow-ring" />
        <span className="heart-wrap">
          <svg viewBox="0 0 24 24" className="heart-icon" role="presentation">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 9.24 3 10.91 3.81 12 5.09 13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
        <span className="button-text">{liked ? 'Liked' : 'Like'}</span>
        <span key={burstKey} className="burst" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className="spark"
              style={{ '--angle': `${index * 36}deg` } as React.CSSProperties}
            />
          ))}
        </span>
      </button>

      <style>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: #000;
        }

        .like-scene {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 30% 25%, rgba(236, 72, 153, 0.17), transparent 40%),
            radial-gradient(circle at 70% 75%, rgba(59, 130, 246, 0.2), transparent 45%),
            #000;
          overflow: hidden;
          padding: 24px;
        }

        .like-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 0;
          border-radius: 999px;
          padding: 18px 38px;
          cursor: pointer;
          background: linear-gradient(145deg, #151515, #080808);
          color: #f4f4f5;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow:
            0 20px 45px rgba(236, 72, 153, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -1px 0 rgba(255, 255, 255, 0.04);
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 300ms ease,
            background 300ms ease;
          isolation: isolate;
        }

        .like-button::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb7185, #ec4899, #8b5cf6, #38bdf8);
          opacity: 0;
          z-index: -2;
          transition: opacity 300ms ease;
          filter: blur(10px);
        }

        .like-button:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow:
            0 24px 52px rgba(236, 72, 153, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(255, 255, 255, 0.06);
        }

        .like-button:active {
          transform: translateY(-1px) scale(0.99);
        }

        .like-button.is-liked {
          background: linear-gradient(145deg, #3b0f26, #14040d);
          box-shadow:
            0 24px 58px rgba(236, 72, 153, 0.45),
            inset 0 1px 0 rgba(255, 208, 231, 0.32),
            inset 0 -1px 0 rgba(255, 158, 193, 0.22);
        }

        .like-button.is-liked::after {
          opacity: 0.85;
        }

        .heart-wrap {
          position: relative;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
        }

        .heart-icon {
          width: 100%;
          height: 100%;
          fill: transparent;
          stroke: #f4f4f5;
          stroke-width: 1.7;
          transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            fill 280ms ease,
            stroke 280ms ease,
            filter 280ms ease;
        }

        .like-button.is-liked .heart-icon {
          fill: #fb7185;
          stroke: #ffd8e7;
          transform: scale(1.12);
          filter: drop-shadow(0 0 10px rgba(251, 113, 133, 0.75));
          animation: heartbeat 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .button-text {
          min-width: 62px;
          text-align: left;
        }

        .glow-ring {
          position: absolute;
          inset: -9px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 320ms ease, transform 320ms ease;
          z-index: -1;
        }

        .like-button.is-liked .glow-ring {
          opacity: 1;
          transform: scale(1);
          border-color: rgba(251, 113, 133, 0.7);
        }

        .burst {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .spark {
          --distance: 52px;
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: radial-gradient(circle, #ffd7e6 0%, #fb7185 45%, #ec4899 100%);
          transform: rotate(var(--angle)) translateY(0);
          opacity: 0;
        }

        .like-button.is-liked .spark {
          animation: pop 680ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes heartbeat {
          0% { transform: scale(0.9); }
          35% { transform: scale(1.27); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1.12); }
        }

        @keyframes pop {
          0% {
            transform: rotate(var(--angle)) translateY(0) scale(0.35);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(0.9);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
