import React from 'react';
import { useMonetization } from '../context/MonetizationContext';

interface TensionGateProps {
  isLocked: boolean;
  onUnlockAd: () => void;
  children: React.ReactNode;
}

export const TensionGate: React.FC<TensionGateProps> = ({ isLocked, onUnlockAd, children }) => {
  const { openPaywall } = useMonetization();

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Content Layer - blurred if locked */}
      <div className="blur-md opacity-50 grayscale select-none pointer-events-none transition-all duration-700 ease-in-out">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 animate-cinematic-reveal">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center shadow-2xl border border-red-500/30 bg-black/80 backdrop-blur-xl">
          <div className="text-4xl mb-4 animate-bounce">🔒</div>
          <h3 className="text-2xl font-bold text-red-400 mb-2 cinematic-text tracking-widest uppercase">High Tension Detected</h3>
          <p className="text-gray-300 mb-6 font-light leading-relaxed">The story has reached a critical cliffhanger. Unlock the next moments.</p>
          
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={onUnlockAd}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 group"
            >
               <span className="group-hover:animate-pulse">Watch Ad to Unlock</span>
            </button>
            
            <button 
              onClick={openPaywall}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 border border-white/20"
            >
              <span>Unlock Pro (No Ads)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};