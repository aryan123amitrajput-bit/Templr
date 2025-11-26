import React, { useEffect, useState, useRef } from 'react';
import { XIcon, HeartIcon, EyeIcon, LockIcon, CheckCircleIcon, GlobeIcon, ArrowRightIcon, UploadIcon, ArrowLeftIcon } from './Icons';
import { Template } from '../api';
import { playClickSound, playSuccessSound } from '../audio';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, template }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (template) {
        setIsUnlocked(template.price === 'Free');
        setIsPurchasing(false);
    }
  }, [template]);

  // --- CONFETTI ENGINE ---
  const triggerConfetti = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: any[] = [];
      const particleCount = 150;
      const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ffffff', '#10b981'];

      for (let i = 0; i < particleCount; i++) {
          particles.push({
              x: canvas.width / 2,
              y: canvas.height * 0.8, // Start from bottom center (button area)
              vx: (Math.random() - 0.5) * 25, // Random X spread
              vy: -(Math.random() * 20 + 10), // Upward velocity
              size: Math.random() * 8 + 4,
              color: colors[Math.floor(Math.random() * colors.length)],
              gravity: 0.8,
              drag: 0.96,
              rotation: Math.random() * 360,
              rotationSpeed: (Math.random() - 0.5) * 10,
              opacity: 1
          });
      }

      let animationFrame: number;

      const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let activeParticles = 0;

          particles.forEach(p => {
              if (p.opacity <= 0) return;
              activeParticles++;

              p.x += p.vx;
              p.y += p.vy;
              p.vy += p.gravity;
              p.vx *= p.drag;
              p.vy *= p.drag;
              p.rotation += p.rotationSpeed;
              p.opacity -= 0.008;

              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate((p.rotation * Math.PI) / 180);
              ctx.globalAlpha = p.opacity;
              ctx.fillStyle = p.color;
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
              ctx.restore();
          });

          if (activeParticles > 0) {
              animationFrame = requestAnimationFrame(animate);
          } else {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
      };

      animate();
  };

  const handlePurchase = () => {
    playClickSound();
    setIsPurchasing(true);
    
    // Simulate API call
    setTimeout(() => {
        setIsPurchasing(false);
        setIsUnlocked(true);
        playSuccessSound();
        triggerConfetti(); // BLAST OFF!
    }, 1500);
  };

  const handlePrimaryAction = () => {
      playClickSound();
      if (!template?.fileUrl || template.fileUrl === '#') {
          alert("This is a demo template. No actual link is attached.");
          return;
      }

      const isExternal = template.fileUrl.startsWith('http') || template.fileUrl.startsWith('https');
      
      if (isExternal) {
          window.open(template.fileUrl, '_blank');
      } else {
          // Simulate Download
          const link = document.createElement('a');
          link.href = template.fileUrl;
          link.download = template.fileName || `${template.title.replace(/\s+/g, '_')}.${template.fileType || 'zip'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
  
  if (!isOpen || !template) return null;

  const isExternalLink = template.fileUrl && (template.fileUrl.startsWith('http') || template.fileUrl.startsWith('https'));
  const primaryActionText = !isUnlocked 
    ? 'Purchase Now' 
    : isExternalLink 
        ? 'Visit Website' 
        : 'Download Asset';

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#000]/95 backdrop-blur-md transition-opacity animate-fade-in p-0 md:p-6"
      onClick={onClose}
    >
      {/* Confetti Canvas Layer */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[110]" />

      {/* Back Button (Mobile/Desktop) */}
      <button 
          onClick={onClose}
          className="fixed top-6 left-6 z-[100] px-4 py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-white transition-all flex items-center gap-2 group active:scale-90"
      >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
      </button>

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-[95rem] h-full md:h-[90vh] bg-[#050505] border border-[#1F1F1F] rounded-none md:rounded-[32px] shadow-[0_0_100px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col lg:flex-row group/modal"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- LEFT PANEL: VISUAL CANVAS --- */}
        <div className="relative flex-1 h-[45vh] lg:h-full bg-[#020203] flex flex-col overflow-hidden">
            
            {/* Canvas Toolbar */}
            <div className="absolute top-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
                <div className="flex bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-1 pointer-events-auto shadow-2xl">
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                        Preview
                    </button>
                    <button 
                        onClick={() => setActiveTab('code')}
                        disabled={!isUnlocked}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'} ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Code {!isUnlocked && <LockIcon className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Canvas Background Grid */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Main Content Area */}
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 lg:p-20">
                {activeTab === 'preview' ? (
                    <div className="relative w-full h-full flex items-center justify-center transition-all duration-700">
                        {/* The Image */}
                        <img 
                            src={template.imageUrl?.replace('/600/400', '/1200/800') || ''} 
                            alt={template.title} 
                            className={`
                                w-auto h-auto max-w-full max-h-full object-contain rounded-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5
                                ${!isUnlocked ? 'blur-md brightness-[0.4] saturate-0 scale-105' : 'blur-0 brightness-100 scale-100'}
                                transition-all duration-700 ease-out
                            `}
                        />

                        {/* Locked Overlay */}
                        {!isUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4">
                                <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[32px] flex flex-col items-center text-center shadow-2xl animate-fade-in-up max-w-md mx-auto">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-500 shadow-[0_0_40px_-5px_rgba(59,130,246,0.3)]">
                                        <LockIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Premium Asset</h3>
                                    <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs">
                                        Unlock the source code, high-res assets, and full documentation for this template.
                                    </p>
                                    <button onClick={handlePurchase} className="px-10 py-4 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform">
                                        Unlock Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Code View (Mockup)
                    <div className="w-full h-full max-w-4xl bg-[#0A0A0A] rounded-xl border border-white/10 p-0 font-mono text-xs text-slate-300 overflow-hidden relative shadow-2xl animate-fade-in flex flex-col">
                        <div className="h-10 bg-[#111] border-b border-white/5 flex items-center px-4 gap-2 flex-shrink-0">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <span className="ml-4 text-slate-500 font-sans text-xs">src/App.tsx</span>
                        </div>
                        <div className="flex-1 p-6 space-y-1.5 opacity-80 overflow-auto custom-scrollbar">
                            <p><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> 'react';</p>
                            <p><span className="text-purple-400">import</span> {'{ motion }'} <span className="text-purple-400">from</span> 'framer-motion';</p>
                            <p className="h-4"></p>
                            <p><span className="text-blue-400">export const</span> <span className="text-yellow-200">App</span> = () {'=>'} {'{'}</p>
                            <p className="pl-4"><span className="text-purple-400">return</span> (</p>
                            <p className="pl-8 text-green-400">{'<div className="min-h-screen bg-black text-white">'}</p>
                            <p className="pl-12 text-green-400">{'<h1 className="text-5xl font-bold">Hello World</h1>'}</p>
                            <p className="pl-8 text-green-400">{'</div>'}</p>
                            <p className="pl-4">);</p>
                            <p>{'};'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>


        {/* --- RIGHT PANEL: CONTROL DASHBOARD --- */}
        <div className="w-full lg:w-[420px] h-[55vh] lg:h-full bg-[#09090b] border-l border-[#1F1F1F] flex flex-col z-30 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* 1. Header Info */}
            <div className="p-6 md:p-8 pb-4 md:pb-6 border-b border-white/5 bg-[#09090b]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                            {template.category}
                        </span>
                         {template.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" /> Verified
                            </span>
                         )}
                    </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight tracking-tight line-clamp-2">{template.title}</h1>
                <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold border border-white/10 shadow-lg">
                        {template.author[0]}
                     </div>
                     <div className="flex flex-col">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Creator</p>
                        <p className="text-sm font-bold text-white hover:text-blue-400 transition-colors cursor-pointer">{template.author}</p>
                     </div>
                </div>
            </div>

            {/* 2. Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 bg-[#09090b] pb-32">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                        <HeartIcon className="w-5 h-5 text-rose-500 mb-2" />
                        <span className="text-lg font-bold text-white">{template.likes}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Likes</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                         <EyeIcon className="w-5 h-5 text-blue-500 mb-2" />
                         <span className="text-lg font-bold text-white">{template.views >= 1000 ? (template.views/1000).toFixed(1) + 'k' : template.views}</span>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider">Views</span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h4 className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest border-b border-white/5 pb-2">Description</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {template.description}
                    </p>
                </div>

                {/* Included Files List */}
                <div>
                    <h4 className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest border-b border-white/5 pb-2">Files Included</h4>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between text-sm p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><CheckCircleIcon className="w-4 h-4" /></div>
                                 <span className="text-slate-200 font-medium">Source Code</span>
                             </div>
                             <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">ZIP</span>
                         </div>
                         {isExternalLink && (
                            <div className="flex items-center justify-between text-sm p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><GlobeIcon className="w-4 h-4" /></div>
                                    <span className="text-slate-200 font-medium">Live Website</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">URL</span>
                            </div>
                         )}
                    </div>
                </div>
            </div>

            {/* 3. Sticky Action Dock (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,1)]">
                
                {/* Price Row */}
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Total Price</p>
                        <p className="text-3xl font-bold text-white tracking-tight">{template.price}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-slate-500 font-medium mb-1">License</p>
                         <p className="text-sm text-white font-medium">Personal & Commercial</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Primary Action Button */}
                    <button 
                        onClick={isUnlocked ? handlePrimaryAction : handlePurchase}
                        disabled={isPurchasing}
                        className={`
                            group relative w-full h-14 rounded-2xl font-bold text-sm uppercase tracking-widest overflow-hidden shadow-xl transition-all active:scale-[0.98]
                            ${isUnlocked 
                                ? 'bg-white text-black hover:bg-slate-200' 
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_20px_-5px_rgba(37,99,235,0.4)]'
                            }
                        `}
                    >
                        {/* Loading State */}
                        {isPurchasing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-700 z-20">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                            {!isUnlocked ? (
                                <>
                                    <span>Purchase Now</span>
                                    <LockIcon className="w-4 h-4 opacity-70" />
                                </>
                            ) : (
                                <>
                                    <span>{primaryActionText}</span>
                                    {isExternalLink ? <GlobeIcon className="w-4 h-4" /> : <UploadIcon className="w-4 h-4 rotate-180" />}
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;