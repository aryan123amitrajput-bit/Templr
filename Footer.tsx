import React from 'react';
import { TwitterIcon, DribbbleIcon, GithubIcon } from './Icons';
import { playTypingSound, playClickSound } from '../audio';
import { ScrollReveal } from './ScrollReveal';

interface FooterProps {
  onShowNotification: (message: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onShowNotification }) => {
  const handleAction = (e: React.MouseEvent, action: string, type: 'scroll' | 'notify' | 'link' = 'notify') => {
    e.preventDefault();
    playClickSound();
    
    if (type === 'scroll') {
        const element = document.getElementById(action);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    } else if (type === 'link') {
        window.open(action, '_blank');
    } else {
        onShowNotification(action);
    }
  };

  return (
    <footer className="bg-[#030304] border-t border-white/[0.08] pt-20 pb-10">
      <div className="container mx-auto px-6">
        
        <ScrollReveal>
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                <div className="max-w-xs">
                    <h4 className="text-white font-bold text-xl mb-4 tracking-tight">Templr</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        The high-performance template marketplace for the modern web.
                    </p>
                </div>
                
                <div className="flex gap-16 text-sm">
                    <div className="flex flex-col gap-4">
                        <span className="text-white font-semibold">Product</span>
                        <a href="#features" onClick={(e) => handleAction(e, 'features', 'scroll')} className="text-slate-500 hover:text-white transition-colors">Features</a>
                        <a href="#" onClick={(e) => handleAction(e, 'Pricing: Pro Plan starts at $29/mo.')} className="text-slate-500 hover:text-white transition-colors">Pricing</a>
                        <a href="#" onClick={(e) => handleAction(e, 'Latest Version: v2.4.0 (Stable)')} className="text-slate-500 hover:text-white transition-colors">Changelog</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <span className="text-white font-semibold">Company</span>
                        <a href="#" onClick={(e) => handleAction(e, 'Templr: Founded in 2024 by Designers.')} className="text-slate-500 hover:text-white transition-colors">About</a>
                        <a href="#" onClick={(e) => handleAction(e, 'We are currently fully staffed!')} className="text-slate-500 hover:text-white transition-colors">Careers</a>
                        <a href="#" onClick={(e) => handleAction(e, 'All systems operational. Data secure.')} className="text-slate-500 hover:text-white transition-colors">Legal</a>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/[0.08]">
                <p className="text-slate-600 text-xs">© 2024 Templr Inc.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="https://twitter.com" onClick={(e) => handleAction(e, 'https://twitter.com', 'link')} className="text-slate-500 hover:text-white transition-colors"><TwitterIcon className="w-4 h-4" /></a>
                    <a href="https://github.com" onClick={(e) => handleAction(e, 'https://github.com', 'link')} className="text-slate-500 hover:text-white transition-colors"><GithubIcon className="w-4 h-4" /></a>
                    <a href="https://dribbble.com" onClick={(e) => handleAction(e, 'https://dribbble.com', 'link')} className="text-slate-500 hover:text-white transition-colors"><DribbbleIcon className="w-4 h-4" /></a>
                </div>
            </div>
        </ScrollReveal>
      </div>
    </footer>
  );
};

export default Footer;