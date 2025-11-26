import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowRightIcon, UploadIcon } from './Icons';
import { playClickSound } from '../audio';
import { MovingBorderButton } from './ui/MovingBorder';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleAnimation from './ParticleAnimation';

interface HeroProps {
  onUploadClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onUploadClick }) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const headlines = useMemo(() => [
    {
        id: 1,
        content: <>Design the <br className="hidden md:block" /> Extraordinary.</>,
        className: "text-6xl md:text-8xl lg:text-9xl bg-gradient-to-b from-[#ffffff] via-[#dbeafe] to-[#64748b] bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(255,255,255,0.25)] leading-[1.1] text-center pb-2"
    },
    {
        id: 2,
        content: "Optimized for phone",
        className: "text-6xl md:text-8xl lg:text-9xl bg-gradient-to-b from-cyan-300 via-blue-600 to-indigo-900 bg-clip-text text-transparent drop-shadow-[0_0_80px_rgba(0,140,255,1.0)] leading-[1.1] text-center pb-2"
    },
    {
        id: 3,
        content: <>The simplest<br/>Template library</>,
        className: "text-5xl md:text-7xl lg:text-8xl bg-gradient-to-b from-orange-400 via-orange-600 to-red-900 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(234,88,12,0.6)] leading-tight text-center pb-4 mx-auto"
    }
  ], []);

  useEffect(() => {
    // Initial 3s hold for the first headline
    let interval: any;
    const timer: any = setTimeout(() => {
        setHeadlineIndex(1); // Move to second headline
        // Start cycle: 1.2s transition + 3.0s hold = 4.2s total interval
        interval = setInterval(() => {
            setHeadlineIndex((prev) => (prev + 1) % headlines.length);
        }, 4200); 
    }, 3000); 

    return () => {
        clearTimeout(timer);
        if (interval) clearInterval(interval);
    };
  }, [headlines.length]);

  const scrollToGallery = () => {
    playClickSound();
    const gallery = document.getElementById('gallery');
    if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
        className="relative h-screen min-h-[900px] w-full flex flex-col items-center justify-center overflow-hidden bg-[#000000]"
    >
      
      {/* --- SUBTLE PARTICLE BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
         <ParticleAnimation />
      </div>

      {/* --- MAIN CONTENT (Z-INDEX 10) --- */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto px-6 mt-[-8vh]">
        
        {/* Release Pill */}
        <div className="animate-reveal-blur opacity-0 [animation-delay:0ms] mb-12 cursor-default relative group will-change-[transform,opacity]">
            <MovingBorderButton
                borderRadius="9999px"
                className="bg-black/90 backdrop-blur-3xl"
                containerClassName="p-[1px]"
                borderClassName="bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-cyan-500 via-cyan-500/40 to-transparent w-24 h-24 opacity-100 blur-[8px]" 
                duration={3000}
            >
                 <div className="flex items-center gap-3 px-5 py-2">
                     <div className="flex items-center gap-1.5">
                         <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                         </span>
                         <span className="text-[11px] font-bold tracking-[0.2em] text-cyan-50 uppercase">Templr v3.0</span>
                     </div>
                     <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
                     <span className="text-[11px] text-slate-400 font-medium tracking-wide group-hover:text-slate-200 transition-colors">
                         The Future of Design
                     </span>
                 </div>
            </MovingBorderButton>
        </div>

        {/* Cinematic Headline with Text Rotator */}
        <div className="relative h-[250px] md:h-[320px] w-full flex items-center justify-center mb-8 overflow-visible perspective-container z-20">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.h1
                    key={headlineIndex}
                    initial={{ y: "40%", opacity: 0, filter: 'blur(20px)', rotateX: -10 }}
                    animate={{ y: "0%", opacity: 1, filter: 'blur(0px)', rotateX: 0 }}
                    exit={{ y: "-40%", opacity: 0, filter: 'blur(20px)', rotateX: 10 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center font-semibold tracking-tighter w-full px-4"
                >
                    <span className={`${headlines[headlineIndex].className} inline-block`}>
                        {headlines[headlineIndex].content}
                    </span>
                </motion.h1>
            </AnimatePresence>
        </div>

        {/* Subtext */}
        <p className="animate-reveal-blur opacity-0 [animation-delay:400ms] text-lg md:text-2xl text-slate-400/80 font-light max-w-2xl mx-auto mb-14 leading-relaxed tracking-wide mix-blend-plus-lighter will-change-[transform,opacity]">
            The curated marketplace for high-fidelity digital assets. <br className="hidden md:block"/>
            <span className="text-slate-500">Built for the obsessive.</span>
        </p>

        {/* Premium Action Stack */}
        <div className="animate-reveal-blur opacity-0 [animation-delay:600ms] flex flex-col md:flex-row items-center gap-6 w-full justify-center will-change-[transform,opacity]">
            
            {/* Primary Button */}
            <button 
                onClick={scrollToGallery}
                className="group relative h-14 px-8 min-w-[200px] rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_-20px_rgba(255,255,255,0.3),0_10px_20px_-10px_rgba(255,255,255,0.1)] overflow-hidden ring-1 ring-white/50"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-100 to-[#d4d4d8]"></div>
                <div className="absolute top-[2px] left-[2px] right-[2px] h-[40%] bg-gradient-to-b from-white to-transparent rounded-t-full opacity-90"></div>
                <div className="absolute bottom-0 inset-x-0 h-[30%] bg-gradient-to-t from-black/10 to-transparent mix-blend-multiply"></div>
                
                {/* Refined Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2.5s_infinite] mix-blend-overlay"></div>
                </div>

                <span className="relative z-10 flex items-center justify-center gap-2 text-black font-bold tracking-wide text-sm drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                    Explore Collection
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
            </button>

            {/* Secondary Button */}
            <button 
                onClick={() => { playClickSound(); onUploadClick(); }}
                className="group relative h-14 px-8 min-w-[200px] rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                 <div className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-xl rounded-full transition-colors group-hover:bg-[#0A0A0A]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)]"></div>
                 <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-black/40">
                     <div className="w-full h-full rounded-full bg-transparent"></div>
                 </div>
                 
                 {/* Internal Glow Pulse */}
                 <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 shadow-[inset_0_0_30px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.05)]"></div>
                 
                 {/* Integrated Rim Light Moving */}
                 <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_3s_infinite] mix-blend-overlay"></div>
                 </div>

                 <div className="absolute top-0 left-4 right-4 h-[1px] bg-white/30 blur-[1px]"></div>
                 <span className="relative z-10 flex items-center justify-center gap-2 text-white font-medium tracking-wide text-sm shadow-black drop-shadow-md">
                    <UploadIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    Submit Work
                 </span>
            </button>
        </div>
      </div>
      
      {/* --- 4. BOTTOM FADE (Seamless Transition) --- */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none"></div>

    </section>
  );
};

export default Hero;