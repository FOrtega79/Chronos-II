import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { StoryTheme } from '../types';

const themes: { id: StoryTheme; title: string; desc: string }[] = [
  { 
    id: 'scifi', 
    title: 'Neon Void', 
    desc: 'Derelict Space Station'
  },
  { 
    id: 'fantasy', 
    title: 'Eldritch Realms', 
    desc: 'Ancient Ruins & Magic'
  },
  { 
    id: 'horror', 
    title: 'Silent Shadows', 
    desc: 'Psychological Terror'
  },
  { 
    id: 'cyberpunk', 
    title: 'Chrome City', 
    desc: 'High Tech, Low Life'
  },
  { 
    id: 'postapocalyptic', 
    title: 'Dust & Bone', 
    desc: 'Wasteland Survival'
  }
];

export const ThemeSelector: React.FC = () => {
  const { startGame, resetGame, isLoading } = useGame();
  const [localSelectedTheme, setLocalSelectedTheme] = useState<StoryTheme | null>(null);

  const handleThemeSelect = (theme: StoryTheme) => {
      if (isLoading) return;
      setLocalSelectedTheme(theme);
      startGame(theme);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex-none p-6 pt-16 text-center animate-cinematic-reveal">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-white/90 mb-3 tracking-widest uppercase" style={{ fontFamily: 'Cinzel, serif', fontVariant: 'small-caps' }}>
          Select Timeline
        </h2>
        <p className="text-gray-600 text-[10px] tracking-[0.4em] uppercase font-sans font-bold">
          Choose Your Reality
        </p>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-32 px-8 pt-4 w-full max-w-md mx-auto">
        {themes.map((theme, idx) => {
          const isSelected = localSelectedTheme === theme.id && isLoading;
          
          return (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            disabled={isLoading}
            className={`group relative w-full p-6 border transition-all duration-300 animate-cinematic-reveal cursor-pointer overflow-hidden
              ${isSelected ? 'border-indigo-500 bg-indigo-900/20 scale-105' : 'border-white/10 hover:border-white/40 bg-white/5 hover:bg-white/10'}
              ${isLoading && !isSelected ? 'opacity-30 grayscale' : ''}
            `}
            style={{ animationDelay: `${(idx + 1) * 100}ms` }}
          >
            {/* Loading Overlay */}
            {isSelected && (
                <div className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col items-start text-left relative z-10">
                <span className={`text-lg font-bold tracking-widest uppercase mb-1 transition-colors ${isSelected ? 'text-indigo-300' : 'text-white group-hover:text-indigo-200'}`}>
                    {theme.title}
                </span>
                 <span className="text-[10px] text-gray-500 tracking-wider uppercase group-hover:text-gray-400 transition-colors">
                    {theme.desc}
                </span>
            </div>
            
            {/* Decorative Corner */}
            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-all duration-300 ${isSelected ? 'border-indigo-500' : 'border-white/20 group-hover:border-white/60'}`}></div>
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-all duration-300 ${isSelected ? 'border-indigo-500' : 'border-white/20 group-hover:border-white/60'}`}></div>
          </button>
        );
        })}
      </div>

      {/* Footer / Back */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none flex justify-center">
         <button 
           onClick={resetGame}
           className="pointer-events-auto text-gray-600 hover:text-gray-300 transition-colors text-[10px] tracking-[0.3em] uppercase py-4"
         >
           Return
         </button>
      </div>
    </div>
  );
};