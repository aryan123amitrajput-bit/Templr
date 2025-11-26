import React, { useRef, useState } from 'react';
import { LayersIcon, SmartphoneIcon, CheckCircleIcon, PaletteIcon, CpuIcon } from './Icons';
import { ScrollReveal } from './ScrollReveal';

// --- 3D TILT CARD WRAPPER ---
const TiltCard = ({ children, className = '', colSpan = 1 }: { children?: React.ReactNode, className?: string, colSpan?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glowX, setGlowX] = useState(50);
    const [glowY, setGlowY] = useState(50);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate rotation (max 10 degrees)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateXValue = ((y - centerY) / centerY) * -5; // Invert Y for natural tilt
        const rotateYValue = ((x - centerX) / centerX) * 5;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
        setGlowX((x / rect.width) * 100);
        setGlowY((y / rect.height) * 100);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setGlowX(50);
        setGlowY(50);
    };

    return (
        <div 
            className={`relative perspective-[1000px] group ${className}`}
            style={{ gridColumn: `span ${colSpan}` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                ref={ref}
                className="relative h-full w-full rounded-[32px] bg-[#0A0A0A] border border-white/5 transition-all duration-200 ease-out overflow-hidden shadow-2xl"
                style={{
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Dynamic Spotlight Glow */}
                <div 
                    className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                    style={{
                        background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.1), transparent 80%)`
                    }}
                />
                
                {/* Content Container (Pushed slightly forward) */}
                <div className="relative z-10 h-full w-full flex flex-col transform-gpu" style={{ transform: 'translateZ(20px)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const WhyTemplr: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-black relative overflow-hidden">
      
      {/* Deep Ambient Background */}
      <div className="absolute inset-0 bg-[#000000]">
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse-glow"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 max-w-[90rem] relative z-10">
        
        <ScrollReveal>
          <div className="mb-20 max-w-3xl">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-[1] drop-shadow-2xl">
                  Built for the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 animate-hue-cycle">impossible.</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed max-w-2xl font-light">
                  A hyper-optimized architecture designed for the next generation of the web.
              </p>
          </div>
        </ScrollReveal>
        
        {/* --- 3D BENTO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[450px]">
            
            {/* CARD 1: UPLOAD YOUR TEMPLATE (Premium 3D Composition) */}
            <ScrollReveal staggerIndex={1} className="md:col-span-2 row-span-1">
                <TiltCard colSpan={2} className="h-full group/card1">
                    {/* Background: Smooth frosted glass & Grid */}
                    <div className="absolute inset-0 bg-[#080808]">
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"></div>
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 opacity-50"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-20 w-full h-full flex flex-col items-center justify-center text-center p-8">
                        
                         {/* Orbiting Elements (Floating dots) */}
                         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                             <div className="w-[300px] h-[300px] rounded-full border border-dashed border-white/5 animate-[spin_30s_linear_infinite]">
                                  {/* Dot 1 */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6]"></div>
                                  {/* Dot 2 */}
                                  <div className="absolute bottom-[15%] left-[15%] w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]"></div>
                             </div>
                             <div className="absolute w-[200px] h-[200px] rounded-full border border-white/5 animate-[spin_20s_linear_infinite_reverse] opacity-50">
                                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                             </div>
                         </div>

                         {/* Central Icon */}
                         <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                             {/* Glow */}
                             <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                             
                             {/* Glass Container */}
                             <div className="relative w-28 h-28 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl">
                                  {/* Plus Icon */}
                                  <svg className="w-10 h-10 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                  </svg>
                                  
                                  {/* File Badge */}
                                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg flex items-center gap-1.5 transform rotate-6 group-hover:rotate-12 transition-transform duration-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                      <span className="text-[9px] font-mono font-bold text-white">ZIP</span>
                                  </div>
                             </div>
                         </div>

                         {/* Text */}
                         <div className="space-y-2">
                             <h3 className="text-3xl font-bold text-white tracking-tight">Upload Your Template</h3>
                             <p className="text-slate-400 text-sm font-medium tracking-wide">Share your landing page in seconds</p>
                         </div>
                    </div>

                    {/* Progress Bar (Bottom Edge) */}
                    <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Uploading Assets...</span>
                            <span className="text-blue-400">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </TiltCard>
            </ScrollReveal>


            {/* CARD 2: HOLOGRAPHIC DEVICES (Glass Planes) */}
            <ScrollReveal staggerIndex={2} className="md:col-span-1 row-span-1">
                <TiltCard className="h-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black"></div>
                    
                    <div className="p-8 h-full flex flex-col relative z-10 overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            <SmartphoneIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Liquid Response</h3>
                        <p className="text-slate-400 text-sm">
                            Fluid layouts that adapt to any glass rectangle.
                        </p>

                        {/* 3D GLASS PANES */}
                        <div className="absolute inset-0 top-[40%] perspective-[800px] flex items-center justify-center pointer-events-none">
                            <div className="relative w-40 h-56 transform-style-3d animate-float-slow">
                                {/* Back Plane (Tablet) */}
                                <div className="absolute top-0 left-[-40px] w-48 h-32 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transform translate-z-[-40px] rotate-y-[-15deg] group-hover:rotate-y-[-25deg] transition-transform duration-500"></div>
                                
                                {/* Middle Plane (Mobile) */}
                                <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-white/20 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transform translate-z-[0px] group-hover:scale-105 transition-transform duration-500 flex flex-col p-3 gap-2">
                                    <div className="w-1/2 h-2 rounded-full bg-white/20"></div>
                                    <div className="w-full h-20 rounded-lg bg-white/5 border border-white/5"></div>
                                    <div className="flex gap-2">
                                        <div className="w-1/2 h-16 rounded-lg bg-purple-500/20"></div>
                                        <div className="w-1/2 h-16 rounded-lg bg-white/5"></div>
                                    </div>
                                </div>

                                {/* Front Plane (Floating UI Element) */}
                                <div className="absolute bottom-[-20px] right-[-30px] w-24 h-24 rounded-2xl bg-white/10 border border-white/30 backdrop-blur-xl shadow-2xl transform translate-z-[40px] rotate-y-[15deg] group-hover:translate-z-[60px] group-hover:rotate-y-[25deg] transition-transform duration-500 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TiltCard>
            </ScrollReveal>


            {/* CARD 3: QUANTUM CORE (Advanced Reactor) */}
            <ScrollReveal staggerIndex={3} className="md:col-span-1 row-span-1">
                <TiltCard className="h-full">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/40 via-black to-black"></div>
                    
                    <div className="p-8 h-full flex flex-col relative z-10 overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <CpuIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Quantum Core</h3>
                        <p className="text-slate-400 text-sm">
                             Next-gen multi-threaded render engine.
                        </p>

                        {/* 3D QUANTUM ENGINE */}
                        <div className="absolute inset-0 top-[20%] flex items-center justify-center perspective-[600px] pointer-events-none">
                             <div className="relative w-40 h-40 transform-style-3d group-hover:scale-125 transition-transform duration-700">
                                 
                                 {/* Tesseract Cube (Inner) */}
                                 <div className="absolute inset-10 transform-style-3d animate-[spin_4s_linear_infinite]">
                                     <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-sm transform translate-z-10"></div>
                                     <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-sm transform translate-z-[-10px]"></div>
                                     <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-sm transform rotate-y-90 translate-z-10"></div>
                                     <div className="absolute inset-0 border border-emerald-400/40 bg-emerald-500/10 backdrop-blur-sm transform rotate-x-90 translate-z-10"></div>
                                 </div>

                                 {/* Orbital Rings (Gyroscope) */}
                                 <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-[spin_8s_linear_infinite_reverse] shadow-[0_0_20px_rgba(16,185,129,0.2)]"></div>
                                 <div className="absolute inset-[-10px] rounded-full border border-dashed border-emerald-400/20 animate-[spin_12s_linear_infinite] rotate-45"></div>
                                 <div className="absolute inset-[-20px] rounded-full border-t border-b border-emerald-300/10 animate-[spin_15s_linear_infinite_reverse] rotate-90"></div>

                                 {/* Central Singularity */}
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_30px_white] animate-pulse"></div>
                                 
                                 {/* Data Particles */}
                                 <div className="absolute top-0 left-1/2 w-1 h-1 bg-emerald-400 shadow-[0_0_10px_white] rounded-full animate-float-delayed"></div>
                                 <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-emerald-300 shadow-[0_0_10px_white] rounded-full animate-float-slow"></div>
                             </div>
                        </div>
                    </div>
                </TiltCard>
            </ScrollReveal>


            {/* CARD 4: THE VOID STREAM (Infinite Parallax) */}
            <ScrollReveal staggerIndex={4} className="md:col-span-2 row-span-1">
                <TiltCard colSpan={2} className="h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-amber-950/20"></div>
                    
                    {/* Content Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-10 z-20 bg-gradient-to-b from-black via-black/80 to-transparent">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <PaletteIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">Infinite Possibilities</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            A curated universe of high-fidelity designs.
                        </p>
                    </div>
                    
                    {/* INFINITE PARALLAX COLUMNS */}
                    <div className="absolute inset-0 flex gap-4 justify-end opacity-50 mask-linear-fade pl-[40%] perspective-[600px] overflow-hidden group-hover:opacity-80 transition-opacity duration-500">
                        {/* Gradient Mask for bottom fade */}
                        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-10"></div>
                        
                        {/* Column 1 (Slow Up) */}
                        <div className="w-32 flex flex-col gap-4 animate-[gridFlow_20s_linear_infinite]">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-40 w-full rounded-xl bg-white/5 border border-white/5 relative overflow-hidden shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-amber-500/20"></div>
                                </div>
                            ))}
                        </div>

                        {/* Column 2 (Fast Down - Main Focus) */}
                        <div className="w-40 flex flex-col gap-4 animate-[gridFlow_15s_linear_infinite_reverse] pt-10">
                             {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-56 w-full rounded-xl bg-[#111] border border-white/10 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-300">
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5"></div>
                                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">PRO</div>
                                </div>
                            ))}
                        </div>

                        {/* Column 3 (Medium Up) */}
                         <div className="w-32 flex flex-col gap-4 animate-[gridFlow_18s_linear_infinite]">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-32 w-full rounded-xl bg-white/5 border border-white/5 relative overflow-hidden opacity-60">
                                    <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/20 to-transparent"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TiltCard>
            </ScrollReveal>

        </div>

      </div>

      <style>{`
          @keyframes fluxWave {
            0%, 100% { height: 40%; opacity: 0.6; }
            50% { height: 90%; opacity: 1; filter: drop-shadow(0 0 10px cyan); }
          }
      `}</style>
    </section>
  );
};

export default WhyTemplr;