import React from 'react';
import { playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';

const CTA: React.FC = () => {
  const handleGetStarted = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-40 relative overflow-hidden bg-black">
      
      {/* Giant Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <ScrollReveal>
            <div className="max-w-4xl mx-auto">
            <h3 className="text-6xl md:text-9xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                Ship your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600">next idea.</span>
            </h3>
            <p className="text-xl md:text-2xl text-slate-500 mb-12 font-light max-w-2xl mx-auto">
                Join the thousands of developers building the future with Templr.
            </p>
            
            <div className="flex justify-center">
                <button 
                onClick={handleGetStarted}
                className="group relative px-12 py-5 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10">Start Building</span>
                </button>
            </div>
            </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTA;