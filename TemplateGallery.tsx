import React, { useState, useMemo } from 'react';
import TemplateCard from './TemplateCard';
import { Template } from '../api';
import { playClickSound } from '../audio';
import { SearchIcon, NoResultsIcon, XIcon } from './Icons';
import { ScrollReveal } from './ScrollReveal';
import { BorderBeam } from './ui/BorderBeam';

const filters = ['All', 'Popular', 'Newest', 'Portfolio', 'E-commerce', 'SaaS', 'Blog'];

interface TemplateGalleryProps {
  templates: Template[];
  onMessageCreator: (creatorName: string) => void;
  onView: (templateId: string) => void;
  onLike: (templateId: string) => void;
  isLoading: boolean;
}

const TemplateCardSkeleton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div 
    style={style}
    className="flex flex-col bg-[#09090b] rounded-[24px] border border-zinc-900 overflow-hidden"
  >
    {/* Image Section */}
    <div className="aspect-[4/3] w-full bg-zinc-900/50 animate-pulse relative overflow-hidden">
       {/* Badge placeholders */}
       <div className="absolute top-4 left-4 w-16 h-6 bg-white/5 rounded-full"></div>
       <div className="absolute top-4 right-4 w-12 h-6 bg-white/5 rounded-full"></div>
       {/* Shimmer overlay */}
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
    </div>
    
    {/* Content Section */}
    <div className="flex flex-col p-5 bg-[#09090b]">
        <div className="space-y-3 mb-6 animate-pulse">
            {/* Title */}
            <div className="h-6 w-3/4 bg-zinc-900 rounded-lg"></div>
            {/* Author */}
            <div className="h-3 w-1/3 bg-zinc-900 rounded-lg"></div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900 animate-pulse">
            <div className="flex gap-4">
                <div className="h-4 w-12 bg-zinc-900 rounded"></div>
                <div className="h-4 w-12 bg-zinc-900 rounded"></div>
            </div>
            {/* Circle Button */}
            <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
        </div>
    </div>
  </div>
);

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ templates, onMessageCreator, onView, onLike, isLoading }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleFilterClick = (filter: string) => {
    playClickSound();
    setActiveFilter(filter);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
        const matchesFilter = activeFilter === 'All' || t.category === activeFilter;
        const matchesSearch = 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });
  }, [templates, activeFilter, searchQuery]);

  return (
    <section id="gallery" className="py-32 relative z-10 bg-black">
      <div className="container mx-auto px-6 md:px-12 max-w-[90rem]">
        
        {/* Floating Filter Dock */}
        <ScrollReveal>
            <div className="sticky top-24 z-40 flex justify-center mb-24 px-4 w-full">
                <div className={`
                    relative group transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                    p-2 bg-[#050505]/80 backdrop-blur-2xl border border-white/[0.08] rounded-full 
                    flex flex-col md:flex-row gap-2 w-full max-w-4xl
                    shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]
                    ${isFocused ? 'scale-[1.01] border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]' : 'hover:border-white/10'}
                `}>
                    
                    {/* Premium Border Beam Effect */}
                    <BorderBeam size={200} duration={8} delay={0} borderWidth={1} colorFrom="#3b82f6" colorTo="#a855f7" className="opacity-70" />
                    
                    {/* Search Input Section */}
                    <div className="relative flex-1 group/search">
                         {/* Ambient Glow behind input */}
                         <div className={`
                            absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent rounded-full opacity-0 blur-xl
                            ${isFocused ? 'opacity-100' : 'group-hover/search:opacity-50'} transition-opacity duration-500
                         `}></div>

                        <div className={`
                            relative h-12 flex items-center rounded-full border transition-all duration-300 overflow-hidden px-4
                            ${isFocused ? 'bg-black border-blue-500/30' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}
                        `}>
                            <SearchIcon className={`w-5 h-5 mr-3 transition-colors duration-300 ${isFocused ? 'text-blue-400' : 'text-slate-500'}`} />
                            <input 
                                type="text" 
                                placeholder="Search templates, tags, creators..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className="w-full h-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => { setSearchQuery(''); playClickSound(); }}
                                    className="p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors animate-fade-in"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Divider (Desktop) */}
                    <div className="hidden md:block w-[1px] my-3 bg-white/10 mx-1"></div>

                    {/* Filters */}
                    <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
                        {filters.map((filter) => (
                            <button
                            key={filter}
                            onClick={() => handleFilterClick(filter)}
                            className={`
                                relative px-5 py-2.5 rounded-full text-[12px] font-bold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden
                                ${activeFilter === filter
                                ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                            `}
                            >
                                <span className="relative z-10">{filter}</span>
                                {activeFilter === filter && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-100"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollReveal>

        {/* Grid */}
        {!isLoading && filteredTemplates.length === 0 ? (
            <ScrollReveal>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center border border-white/5 rounded-[2rem] bg-gradient-to-b from-white/[0.02] to-transparent p-12">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500 border border-white/5 shadow-inner">
                        <NoResultsIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2 tracking-tight">No results found</h4>
                    <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">We couldn't find any templates matching "{searchQuery}". Try adjusting your search or filters.</p>
                    <button 
                        onClick={() => { setSearchQuery(''); setActiveFilter('All'); playClickSound(); }}
                        className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Clear Filters
                    </button>
                </div>
            </ScrollReveal>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12">
            {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => <TemplateCardSkeleton key={index} style={{ animationDelay: `${index * 100}ms` }} />)
            ) : (
                filteredTemplates.map((template, index) => (
                    <ScrollReveal key={template.id} staggerIndex={index % 3}>
                        <TemplateCard 
                            {...template} 
                            onMessageCreator={onMessageCreator}
                            onView={() => onView(template.id)}
                            onLike={() => onLike(template.id)}
                        />
                    </ScrollReveal>
                ))
            )}
            </div>
        )}
      </div>
    </section>
  );
};

export default TemplateGallery;