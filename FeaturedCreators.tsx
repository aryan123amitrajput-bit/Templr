import React, { useRef, useState, useEffect } from 'react';
import { playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';

const creators = [
  { name: 'Eva Neuro', handle: '@evaneuro', role: 'UI/UX Specialist', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { name: 'Liam Cygnus', handle: '@liamcygnus', role: 'Frontend Wizard', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
  { name: 'Nova Synth', handle: '@novasynth', role: 'Motion Designer', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
  { name: 'Jax Orion', handle: '@jaxorion', role: 'Web3 Developer', imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d' },
];

const FeaturedCreators: React.FC = () => {
  return (
    <section className="py-32 bg-black border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 max-w-[90rem]">
        
        <ScrollReveal>
            <div className="flex flex-col items-center text-center mb-20">
                <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">Featured Creators</h3>
                <p className="text-slate-400">Top talents shaping the visual web.</p>
            </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {creators.map((creator, index) => (
            <ScrollReveal key={creator.name} staggerIndex={index}>
                <div className="group relative flex flex-col items-center text-center p-8 rounded-[2rem] bg-[#050505] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:translate-y-[-8px]">
                    
                    <div className="relative mb-6">
                        {/* Glow ring */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-500"></div>
                        
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-black group-hover:border-white/20 transition-colors">
                            <img
                                src={creator.imageUrl}
                                alt={creator.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                    </div>
                    
                    <h4 className="font-bold text-lg text-white mb-1">{creator.name}</h4>
                    <p className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-6">{creator.role}</p>
                    
                    <button className="px-6 py-2 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-slate-300 hover:bg-white hover:text-black hover:border-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                        View Profile
                    </button>
                </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCreators;