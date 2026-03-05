import React from 'react';
import { useGame } from '../context/GameContext';

export const GameOverScreen: React.FC = () => {
  const { currentBeat, resetGame, loadGame, hasSave } = useGame();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Glitch Overlay */}
      <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY255ODZ6Zmx3cHRweHl0eG94Zmx3cHRweHl0eG94Zmx3cHRweHl0eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0qTl8qvBmVDh4Am2Y/giphy.gif')] opacity-10 pointer-events-none mix-blend-screen bg-cover" />
      
      <div className="z-10 max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold text-red-600 cinematic-text tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
            SIGNAL LOST
            </h1>
            <p className="text-red-900/50 uppercase tracking-[0.5em] text-xs">Timeline Terminated</p>
        </div>

        <div className="border-l-2 border-red-800/50 pl-6 text-left py-4 bg-red-950/10 backdrop-blur-sm rounded-r-lg">
            <p className="text-gray-300 font-serif text-xl md:text-2xl italic leading-relaxed">
                "{currentBeat?.narrative_text || "The connection was severed abruptly."}"
            </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pt-8">
             {hasSave && (
               <button 
                 onClick={loadGame}
                 className="w-full py-4 bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold tracking-widest transition-all rounded-sm flex justify-center items-center gap-2"
               >
                   LOAD CHECKPOINT
               </button>
             )}
             
             <button 
               onClick={resetGame}
               className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold tracking-widest transition-all rounded-sm shadow-[0_0_20px_rgba(185,28,28,0.4)]"
             >
                 SYSTEM REBOOT
             </button>
        </div>
      </div>
    </div>
  );
};