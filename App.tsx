import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MonetizationProvider, useMonetization } from './context/MonetizationContext';
import { SplashScreen } from './components/SplashScreen';
import { StoryView } from './components/StoryView';
import { ThemeSelector } from './components/ThemeSelector';
import { Paywall } from './components/Paywall';
import { AdOverlay } from './components/AdOverlay';
import { GameOverScreen } from './components/GameOverScreen';
import { InventoryModal } from './components/InventoryModal';
import { AppStatus } from './types';

const GameContent: React.FC = () => {
  const { appStatus, enterThemeSelection, resetGame, isLoading, saveGame, loadGame, hasSave, gameState, makeChoice, isNarrationEnabled, toggleNarration, isPlayingAudio, isAudioLoading } = useGame();
  const { isAdShowing, isPremium, showPaywallModal, openPaywall, closePaywall } = useMonetization();
  const [showSplash, setShowSplash] = useState(true);
  const [saveNotification, setSaveNotification] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5s splash
    return () => clearTimeout(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.hamburger-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleSave = () => {
    saveGame();
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2000);
  };

  const handleInspect = (item: string) => {
    setShowInventory(false);
    makeChoice(`Inspect ${item}`);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  // GAME OVER STATE
  if (appStatus === AppStatus.GAME_OVER) {
    return (
      <div className="w-full h-screen bg-black relative">
        <GameOverScreen />
        {isAdShowing && <AdOverlay />}
      </div>
    );
  }

  // THEME SELECTION STATE
  if (appStatus === AppStatus.THEME_SELECT) {
    return (
      <div className="w-full h-screen bg-black">
        <ThemeSelector />
        {isAdShowing && <AdOverlay />}
      </div>
    );
  }

  // MENU STATE
  if (appStatus === AppStatus.MENU || appStatus === AppStatus.SPLASH) {
     return (
       <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
         {/* Abstract BG */}
         <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=8')] bg-cover opacity-30" />
         
         <div className="z-10 text-center space-y-8 p-4">
           <h1 className="text-6xl md:text-8xl font-bold cinematic-text text-white tracking-tighter mb-4">CHRONOS</h1>
           <p className="text-xl text-gray-400 max-w-md mx-auto">Infinite possibilities. One timeline. Yours.</p>
           
           <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
             {hasSave && (
               <button 
                 onClick={loadGame}
                 disabled={isLoading}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest transition-all rounded-sm flex justify-center items-center gap-2 border border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   {isLoading ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>RESUMING...</span>
                     </>
                   ) : (
                     'CONTINUE TIMELINE'
                   )}
               </button>
             )}
             
             <button 
               onClick={enterThemeSelection}
               disabled={isLoading}
               className={`w-full py-4 bg-white text-black font-bold tracking-widest transition-all rounded-sm flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200'}`}
             >
                 {isLoading && !hasSave ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>INITIALIZING...</span>
                    </>
                 ) : (
                    hasSave ? 'NEW TIMELINE' : 'BEGIN STORY'
                 )}
             </button>
             
             {!isPremium && (
                <button 
                  onClick={openPaywall}
                  disabled={isLoading}
                  className="w-full py-4 border border-white/20 text-white hover:bg-white/10 transition-colors rounded-sm text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  REMOVE ADS
                </button>
             )}
           </div>
         </div>
         
         {showPaywallModal && <Paywall onClose={closePaywall} />}
       </div>
     );
  }

  // PLAYING STATE
  return (
    <div className="w-full h-screen bg-black relative">
      <StoryView />
      
      {/* Controls Top Right */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        {/* Save Notification */}
        <div className={`transition-all duration-500 ${saveNotification ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} pointer-events-none`}>
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-emerald-500/30">
            Checkpoint Saved
          </span>
        </div>

        {/* Narration Toggle - Kept outside for quick access */}
        <button 
            onClick={() => {
                if (!isPremium && !isNarrationEnabled) {
                    openPaywall();
                } else {
                    toggleNarration();
                }
            }}
            disabled={isAudioLoading}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white border transition-all hover:scale-110 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isNarrationEnabled ? 'border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'border-white/20 text-gray-400'}`}
            title={isNarrationEnabled ? "Disable Narration" : "Enable Narration (Premium)"}
        >
            {isAudioLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
            ) : isNarrationEnabled ? (
                <div className="relative flex items-center justify-center">
                    {isPlayingAudio && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.406.235-.847 1.058-1.354 1.938-1.354h2.241z" />
                    </svg>
                </div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.406.235-.847 1.058-1.354 1.938-1.354h2.241z" />
                </svg>
            )}
        </button>

        {/* Hamburger Menu */}
        <div className="relative hamburger-menu-container">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white border transition-all hover:scale-110 active:scale-95 z-50 relative ${isMenuOpen ? 'border-white/40 bg-white/10' : 'border-white/20'}`}
            >
                {isMenuOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                )}
            </button>

            {/* Dropdown Menu */}
            <div className={`
                absolute top-12 right-0 w-48 
                bg-black/90 backdrop-blur-xl 
                border border-white/10 rounded-xl 
                shadow-[0_10px_40px_rgba(0,0,0,0.5)] 
                overflow-hidden
                transition-all duration-300 origin-top-right
                flex flex-col
                ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <div className="p-1 flex flex-col gap-1">
                    {/* Inventory */}
                    <button 
                        onClick={() => {
                            setShowInventory(true);
                            setIsMenuOpen(false);
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <span className="tracking-wider text-xs uppercase font-medium">Inventory</span>
                    </button>

                    {/* Save */}
                    <button 
                        onClick={() => {
                            handleSave();
                            setIsMenuOpen(false);
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" />
                        </svg>
                        <span className="tracking-wider text-xs uppercase font-medium">Save Progress</span>
                    </button>

                    <div className="h-px bg-white/10 mx-2 my-1"></div>

                    {/* Close/Exit */}
                    <button 
                        onClick={() => {
                            resetGame();
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="tracking-wider text-xs uppercase font-medium">Close Story</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Global Overlays */}
      {showInventory && gameState && (
        <InventoryModal 
            items={gameState.playerInventory} 
            onClose={() => setShowInventory(false)} 
            onInspect={handleInspect}
        />
      )}
      {isAdShowing && <AdOverlay />}
      {showPaywallModal && <Paywall onClose={closePaywall} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MonetizationProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </MonetizationProvider>
  );
};

export default App;