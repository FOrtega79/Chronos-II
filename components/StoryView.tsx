import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { TensionGate } from './TensionGate';
import { useMonetization } from '../context/MonetizationContext';

export const StoryView: React.FC = () => {
  const { currentBeat, makeChoice, isLoading, currentImage, gameState } = useGame();
  const { isPremium, showRewardedAd } = useMonetization();
  
  // Local state to track ad unlocks for specific cliffhangers
  const [isAdUnlocked, setIsAdUnlocked] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Relationship Tracking
  const [relationshipUpdates, setRelationshipUpdates] = useState<{name: string, diff: number}[]>([]);
  const prevRelationshipsRef = useRef<Record<string, number>>({});
  const isFirstRun = useRef(true);

  // Reset states when moving to a new beat
  useEffect(() => {
    setIsAdUnlocked(false);
    setIsDrawerOpen(false);
  }, [currentBeat]);

  // Scroll to top of the content area whenever the beat changes to ensure readability from start
  useEffect(() => {
    if (scrollContainerRef.current && !isLoading) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentBeat, isLoading]);

  // Calculate Relationship Updates
  useEffect(() => {
    if (!gameState) return;
    
    const currentRelsMap: Record<string, number> = {};
    gameState.npcRelationships.forEach(r => currentRelsMap[r.name] = r.score);

    if (isFirstRun.current) {
        prevRelationshipsRef.current = currentRelsMap;
        isFirstRun.current = false;
        return;
    }

    const prevRelsMap = prevRelationshipsRef.current;
    const updates: {name: string, diff: number}[] = [];

    for (const [name, score] of Object.entries(currentRelsMap)) {
      const prevScore = prevRelsMap[name] !== undefined ? prevRelsMap[name] : 0;
      // Consider a relationship "new" if we didn't track it before, or just an update if score changed
      if (prevRelsMap[name] === undefined) {
         updates.push({ name, diff: score }); 
      } else if (prevScore !== score) {
         updates.push({ name, diff: score - prevScore });
      }
    }

    prevRelationshipsRef.current = currentRelsMap;
    // Only update state if there are actual changes to prevent unnecessary re-renders or empty lists
    if (updates.length > 0) {
        setRelationshipUpdates(updates);
    } else {
        setRelationshipUpdates([]);
    }
  }, [gameState]);


  if (!currentBeat || !gameState) return null;

  // Determine Lock Status
  const isCliffhanger = currentBeat.tension_score > 7;
  const isLocked = isCliffhanger && !isPremium && !isAdUnlocked;

  // Handler for Ad Unlock
  const handleUnlockAd = () => {
    showRewardedAd(() => {
      setIsAdUnlocked(true);
    });
  };

  // Generate a stable key for the beat to trigger animations
  const beatKey = `${gameState.currentLocation}_${currentBeat.narrative_text.substring(0, 15)}`;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-black">
      {/* Background Layer - Absolute behind everything */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Darker gradient for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 z-10" /> 
        {currentImage ? (
           <img 
             key={currentImage}
             src={currentImage} 
             alt="Scene background" 
             className="w-full h-full object-cover animate-bg-enter opacity-0" 
           />
        ) : (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-950">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-gray-950 to-black animate-pulse" style={{ animationDuration: '4s' }} />
             <div className="z-10 flex flex-col items-center gap-4 opacity-30">
                 <div className="w-12 h-12 border-2 border-indigo-500/10 border-t-indigo-500/50 rounded-full animate-spin duration-1000"></div>
                 <span className="text-[10px] uppercase tracking-[0.4em] text-indigo-300/40 font-light animate-pulse">Visualizing</span>
             </div>
          </div>
        )}
      </div>

      {/* Main Layout Container */}
      <div className="relative z-10 h-full w-full max-w-5xl mx-auto flex flex-col">
        
        {/* Header HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 p-6 pt-8 flex flex-col gap-2 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none">
            <div className="flex justify-between items-start w-full pointer-events-auto">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4 text-xs tracking-[0.2em] font-semibold text-gray-400 uppercase shadow-black drop-shadow-md">
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span> 
                            {gameState.currentLocation}
                        </div>
                    </div>
                    
                    {/* Health Bar */}
                    <div className="flex flex-col gap-1 w-40 pl-4">
                        <div className="flex justify-between text-[10px] tracking-widest text-gray-500 font-mono">
                            <span>VITALS</span>
                            <span className={gameState.health < 30 ? "text-red-500" : "text-emerald-400"}>{gameState.health}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${gameState.health < 30 ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : gameState.health < 60 ? 'bg-yellow-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                                style={{ width: `${Math.max(0, Math.min(100, gameState.health))}%` }}
                            />
                        </div>
                    </div>
                </div>

                {!isPremium && (
                    <div className="mr-20">
                        <div className="text-[10px] tracking-widest text-yellow-500 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded backdrop-blur-sm shadow-lg">
                            LIMITED ACCESS
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Scrollable Story Area */}
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto no-scrollbar pt-32 pb-48 px-6 md:px-12 relative"
        >
            <TensionGate 
                key={beatKey} 
                isLocked={isLocked} 
                onUnlockAd={handleUnlockAd}
            >
                <div className={`space-y-8 transition-all duration-700 ${isLoading ? 'opacity-40 blur-sm scale-[0.99]' : 'opacity-100 scale-100'}`}>
                    {/* System Log */}
                    {gameState.narrativeHistory.length > 0 && (
                        <div className="opacity-0 animate-[slideDownFade_1s_ease-out_0.2s_forwards] flex flex-col items-start gap-2">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-6 bg-indigo-500/50"></div>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-indigo-400/80 font-sans">System Log</span>
                            </div>
                            <p className="text-gray-400/80 text-sm font-sans font-light leading-relaxed pl-9 border-l border-indigo-500/10">
                                "{gameState.narrativeHistory[gameState.narrativeHistory.length - 1]}"
                            </p>
                        </div>
                    )}

                    {/* Relationship Updates */}
                    {relationshipUpdates.length > 0 && (
                        <div className="flex flex-wrap gap-3 animate-[slideDownFade_0.8s_ease-out_0.5s_forwards] opacity-0">
                           {relationshipUpdates.map((update, idx) => (
                             <div 
                               key={`${update.name}-${idx}`}
                               className={`
                                 flex items-center gap-2 px-3 py-1.5 rounded-r-md border-l-2 backdrop-blur-sm bg-black/40
                                 ${update.diff > 0 
                                    ? 'border-emerald-500 text-emerald-400' 
                                    : 'border-rose-500 text-rose-400'}
                               `}
                             >
                               <span className="text-xs font-bold uppercase tracking-wider">{update.name}</span>
                               <span className="text-xs font-mono">
                                 {update.diff > 0 ? '+' : ''}{update.diff}
                               </span>
                             </div>
                           ))}
                        </div>
                    )}

                    {/* Narrative Text */}
                    <p 
                        key={currentBeat.narrative_text}
                        className="text-2xl md:text-3xl lg:text-4xl leading-relaxed font-serif text-white animate-cinematic-reveal tracking-wide"
                        style={{ 
                          textShadow: '0 2px 10px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.8)' 
                        }}
                    >
                        {currentBeat.narrative_text}
                    </p>
                </div>
            </TensionGate>
        </div>

        {/* Liquid Glass Drawer */}
        <div 
            className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) transform ${isLoading || isLocked ? 'translate-y-[120%]' : 'translate-y-0'}`}
        >
             {/* Loading State Behind Drawer */}
             {isLoading && (
                 <div className="absolute -top-16 w-full text-center">
                    <span className="inline-block px-4 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[10px] tracking-[0.3em] uppercase text-indigo-300 animate-pulse shadow-lg">Simulating Timeline...</span>
                 </div>
             )}

            <div 
                className={`
                    w-full mx-auto max-w-3xl
                    bg-gradient-to-b from-gray-900/60 via-black/80 to-black
                    backdrop-blur-3xl
                    border-t border-white/10
                    shadow-[0_-10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]
                    rounded-t-[40px]
                    transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1)
                    flex flex-col
                    overflow-hidden
                    ${isDrawerOpen ? 'h-[75vh]' : 'h-24'}
                `}
            >
                {/* Subtle sheen highlight on top edge */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
                
                {/* Toggle Handle Area */}
                <button 
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className="w-full h-24 flex-shrink-0 flex flex-col items-center pt-5 gap-3 hover:bg-white/5 transition-colors cursor-pointer group outline-none relative z-20"
                >
                    {/* Glowing Handle */}
                    <div className="w-16 h-1.5 bg-gray-500/30 rounded-full group-hover:bg-indigo-400/80 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-500 ease-out" />
                    
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 group-hover:text-white font-bold transition-colors">
                            {isDrawerOpen ? 'Minimize' : 'Decide'}
                        </span>
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className={`w-3 h-3 text-indigo-500 transition-transform duration-500 ${isDrawerOpen ? 'rotate-180' : ''}`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    </div>
                </button>

                {/* Options List */}
                <div className={`
                    flex-1 overflow-y-auto px-6 pb-12 pt-2 
                    transition-all duration-500 
                    ${isDrawerOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
                `}>
                    <div className="flex flex-col gap-4 max-w-xl mx-auto">
                        {currentBeat.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setIsDrawerOpen(false);
                                setTimeout(() => makeChoice(opt.action), 300);
                            }}
                            className="
                                group relative overflow-hidden
                                w-full text-left p-6 rounded-2xl
                                bg-gradient-to-br from-white/5 to-white/0
                                border border-white/5
                                hover:border-indigo-500/30
                                transition-all duration-300 ease-out
                                hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                            "
                        >
                            {/* Liquid Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
                            
                            <div className="relative z-10 flex flex-col gap-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] uppercase tracking-widest text-indigo-300/60 group-hover:text-indigo-300 transition-colors">Path 0{idx + 1}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                                </div>
                                <span className="text-xl font-medium font-serif text-gray-200 group-hover:text-white leading-snug">
                                    {opt.label}
                                </span>
                            </div>
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};