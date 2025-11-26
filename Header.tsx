import React, { useState, useEffect, useRef } from 'react';
import { UploadIcon } from './Icons';
import { playClickSound } from '../audio';
import type { Session } from '../api';
import { BorderBeam } from './ui/BorderBeam';

interface HeaderProps {
  session: Session | null;
  onUploadClick: () => void;
  onLoginClick: () => void;
  onSignOut: () => void;
  onDashboardClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ session, onUploadClick, onLoginClick, onSignOut, onDashboardClick }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-6 px-6 pointer-events-none">
        <header 
            className="pointer-events-auto bg-[#0A0A0A]/90 backdrop-blur-md border border-[#1F1F1F] py-2.5 px-4 rounded-full shadow-2xl flex items-center gap-6 sm:gap-12 animate-slide-up opacity-0 [animation-delay:200ms]"
        >
            {/* Logo */}
            <div 
                className="flex items-center gap-2 group cursor-pointer" 
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
                <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-[1px]"></div>
                </div>
                <span className="font-display font-bold text-sm tracking-tight text-white">Templr</span>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
                {['Work', 'Studio', 'About'].map((item) => (
                    <a 
                        key={item}
                        href="#" 
                        onClick={(e) => { e.preventDefault(); playClickSound(); }}
                        className="px-4 py-1.5 text-[13px] text-slate-400 hover:text-white transition-colors"
                    >
                        {item}
                    </a>
                ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {session ? (
                    <>
                        <button 
                            onClick={() => { playClickSound(); onUploadClick(); }}
                            className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            <span>Submit</span>
                        </button>
                        
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="block rounded-full focus:outline-none active:scale-95 transition-transform">
                                <img 
                                    src={session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email || 'U')}&background=333&color=fff`} 
                                    alt="User" 
                                    className="w-7 h-7 rounded-full border border-[#333]"
                                />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-4 w-48 bg-[#111] border border-[#222] rounded-lg shadow-xl py-1 overflow-hidden animate-fade-in">
                                    <button onClick={() => { onDashboardClick(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Dashboard</button>
                                    <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Sign Out</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button 
                        onClick={() => { playClickSound(); onLoginClick(); }}
                        className="relative overflow-hidden px-6 py-1.5 text-[12px] font-semibold text-white bg-slate-900/50 hover:bg-slate-800 transition-colors rounded-full border border-white/10 group"
                    >
                        <span className="relative z-10">Log In</span>
                        <BorderBeam size={40} duration={3} delay={0} colorFrom="#60a5fa" colorTo="#3b82f6" />
                    </button>
                )}
            </div>
      </header>
    </div>
  );
};

export default Header;