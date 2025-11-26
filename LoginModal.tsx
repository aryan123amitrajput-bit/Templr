import React, { useState, useEffect, useRef, memo } from 'react';
import { XIcon, LockIcon } from './Icons';
import { playClickSound, playSuccessSound, playTypingSound } from '../audio';

// --- Icons ---
const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

// --- Orbital Lock Animation ---
const OrbitalLock = () => (
  <div className="relative w-24 h-24 flex items-center justify-center mb-6 pointer-events-none">
    {/* Outer Ring */}
    <div className="absolute inset-0 rounded-full border border-cyan-500/10 border-t-cyan-400/60 animate-[spin_4s_linear_infinite]"></div>
    {/* Middle Ring */}
    <div className="absolute inset-4 rounded-full border border-blue-500/10 border-b-blue-400/60 animate-[spin_3s_linear_infinite_reverse]"></div>
    {/* Inner Ring */}
    <div className="absolute inset-7 rounded-full border border-white/5 border-l-white/40 animate-[spin_2s_linear_infinite]"></div>
    
    {/* Core */}
    <div className="relative z-10 flex items-center justify-center w-10 h-10 bg-cyan-950/50 rounded-full shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] backdrop-blur-sm border border-cyan-500/20">
        <LockIcon className="w-4 h-4 text-cyan-200" />
    </div>
    
    {/* Ambient Glow */}
    <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl animate-pulse"></div>
  </div>
);

// --- Reusable Premium Input ---
const PremiumInput = ({ icon: Icon, ...props }: any) => (
    <div className="group relative">
        {/* Background layer with inset shadow for depth */}
        <div className="absolute inset-0 bg-[#030407] rounded-2xl border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-white/20 group-focus-within:border-cyan-500/40 group-focus-within:bg-[#05060a] group-focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_0_30px_-10px_rgba(6,182,212,0.1)] z-0"></div>
        
        {/* Bottom highlight line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-500 group-focus-within:w-3/4 opacity-0 group-focus-within:opacity-100 blur-[1px] z-0"></div>

        <div className="relative z-10 flex items-center">
            {/* Icon Container */}
            <div className="pl-5 pr-4 py-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300">
                <div className="relative">
                    <Icon className="w-5 h-5 relative z-10 transition-transform duration-300 group-focus-within:scale-110" />
                    {/* Icon glow blob */}
                    <div className="absolute inset-0 bg-cyan-400/30 blur-md rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                </div>
            </div>
            
            {/* Vertical Divider */}
            <div className="h-6 w-[1px] bg-white/5 group-focus-within:bg-cyan-500/20 transition-colors duration-300"></div>

            {/* Input - High Z-Index to ensure clickability */}
            <input
                {...props}
                className="
                    relative z-50 w-full bg-transparent border-none rounded-2xl py-4 px-4
                    text-white placeholder-slate-600 text-sm font-medium tracking-wide
                    focus:outline-none focus:ring-0
                "
            />
        </div>
    </div>
);

// --- Background Component (Memoized) ---
const BackgroundLayer = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        let animationFrameId: number;
        let particles: Array<{
          x: number;
          y: number;
          size: number;
          speedY: number;
          opacity: number;
          pulseSpeed: number;
        }> = [];
    
        const resizeCanvas = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
    
        const createParticles = () => {
          const particleCount = 60; 
          particles = [];
          for (let i = 0; i < particleCount; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              size: Math.random() * 1.5 + 0.5,
              speedY: -(Math.random() * 0.3 + 0.05), 
              opacity: Math.random() * 0.4,
              pulseSpeed: Math.random() * 0.02,
            });
          }
        };
    
        const drawParticles = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          particles.forEach((p) => {
            p.y += p.speedY;
            
            // Oscillation
            p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;
            
            // Wrap around
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }
    
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, p.opacity))})`;
            
            ctx.fill();
            ctx.shadowBlur = 0;
          });
    
          animationFrameId = requestAnimationFrame(drawParticles);
        };
    
        resizeCanvas();
        createParticles();
        drawParticles();
    
        window.addEventListener('resize', resizeCanvas);
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
      }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grid Floor */}
            <div className="absolute inset-0 overflow-hidden">
                <div 
                    className="absolute inset-[-100%] bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]"
                    style={{
                        transform: 'perspective(600px) rotateX(60deg) translateY(0)',
                        animation: 'gridFlow 15s linear infinite',
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                    }}
                ></div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 z-0 mix-blend-screen" />
            
            {/* Deep Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#02040a_90%)]"></div>
        </div>
    );
});


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignup: (email: string, pass: string, name: string) => Promise<void>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setMode('login');
            setEmail('');
            setPassword('');
            setName('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playClickSound();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await onLogin(email, password);
            } else {
                if (!name) throw new Error("Name is required");
                await onSignup(email, password, name);
            }
            playSuccessSound();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm transition-opacity duration-500"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-[400px] bg-[#0A0A0A] rounded-[32px] overflow-hidden shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 animate-fade-in-scale">
                
                <BackgroundLayer />

                {/* Close Button */}
                <button 
                    onClick={() => { playClickSound(); onClose(); }}
                    className="absolute top-5 right-5 z-50 p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                <div className="relative z-10 p-8 flex flex-col items-center">
                    
                    <OrbitalLock />

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-400 text-sm mb-8 text-center max-w-[240px]">
                        {mode === 'login' 
                            ? 'Enter your credentials to access your dashboard.' 
                            : 'Join the community of creators building the future.'}
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        {mode === 'signup' && (
                            <PremiumInput 
                                icon={UserIcon}
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
                                required
                            />
                        )}
                        
                        <PremiumInput 
                            icon={MailIcon}
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                            required
                        />

                        <PremiumInput 
                            icon={LockIcon}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="
                                relative w-full h-14 mt-6 rounded-xl font-bold text-sm tracking-wide uppercase
                                bg-white text-black hover:bg-slate-200 active:scale-[0.98] transition-all
                                disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden
                            "
                        >
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                </div>
                            )}
                            <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                                {mode === 'login' ? 'Sign In' : 'Sign Up'}
                            </span>
                        </button>
                    </form>

                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span>{mode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
                        <button 
                            type="button"
                            onClick={() => { playClickSound(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                            className="text-white hover:text-cyan-400 transition-colors"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginModal;