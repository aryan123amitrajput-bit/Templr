import React, { useState, useEffect, useRef } from 'react';
import { HeartIcon, EyeIcon, ArrowRightIcon } from './Icons';
import { playClickSound, playLikeSound } from '../audio';

interface TemplateCardProps {
  title: string;
  author: string;
  imageUrl: string;
  likes: number;
  views: number;
  isLiked: boolean;
  category: string;
  price?: string;
  onMessageCreator: (authorName: string) => void;
  onView: () => void;
  onLike: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  title, 
  author, 
  imageUrl, 
  likes, 
  views, 
  isLiked, 
  category, 
  price = 'Free', 
  onView, 
  onLike 
}) => {
  const [likeBump, setLikeBump] = useState(false);
  const isFirstRender = useRef(true);

  // Trigger pop animation when 'likes' prop changes
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setLikeBump(true);
    const timer = setTimeout(() => setLikeBump(false), 200);
    return () => clearTimeout(timer);
  }, [likes]);
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) playLikeSound();
    else playClickSound();
    onLike();
  };

  const handleCardClick = () => {
    playClickSound();
    onView();
  };

  return (
    <div
      className="group relative flex flex-col bg-[#09090b] rounded-[24px] border border-zinc-900 overflow-hidden transition-all duration-300 active:scale-95 active:border-zinc-700 cursor-pointer shadow-sm hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)]"
      onClick={handleCardClick}
    >
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111]">
            <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-active:scale-105 group-hover:scale-105"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
                 <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/10 text-white">
                    {category}
                 </div>
            </div>

            <div className="absolute top-4 right-4">
                <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border border-white/10 shadow-lg ${price === 'Free' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                    {price}
                </div>
            </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col p-5 bg-[#09090b]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg leading-tight mb-1.5 line-clamp-1">{title}</h3>
                    <div className="flex items-center gap-2 group/author">
                        <span className="text-xs text-zinc-500 font-medium">by {author}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <div className="flex items-center gap-5">
                     <button 
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 -ml-2 rounded-lg active:bg-white/5 ${isLiked ? 'text-rose-500' : 'text-zinc-500'}`}
                    >
                        <HeartIcon className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className={`inline-block transition-transform duration-200 ${likeBump ? 'scale-150 font-bold text-rose-400' : 'scale-100'}`}>
                            {likes}
                        </span>
                    </button>
                    
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                        <EyeIcon className="w-4 h-4" />
                        <span>{views >= 1000 ? (views/1000).toFixed(1) + 'k' : views}</span>
                    </div>
                </div>
                
                {/* Mobile Call to Action Arrow */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-active:bg-blue-600 group-active:text-white transition-colors">
                    <ArrowRightIcon className="w-4 h-4" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default TemplateCard;