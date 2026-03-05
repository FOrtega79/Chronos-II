import React from 'react';

interface InventoryModalProps {
  items: string[];
  onClose: () => void;
  onInspect: (item: string) => void;
}

// Helper to get icon based on item name keywords
const getItemIcon = (name: string) => {
  const n = name.toLowerCase();
  
  // Tech / Data / Electronics
  if (n.includes('chip') || n.includes('drive') || n.includes('disk') || n.includes('data') || n.includes('device') || n.includes('module') || n.includes('battery')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  
  // Weapons / Offense
  if (n.includes('gun') || n.includes('rifle') || n.includes('pistol') || n.includes('sword') || n.includes('blade') || n.includes('knife') || n.includes('weapon') || n.includes('ammo')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    );
  }

  // Keys / Access / IDs
  if (n.includes('key') || n.includes('card') || n.includes('pass') || n.includes('access') || n.includes('badge') || n.includes('id')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    );
  }

  // Healing / Medical
  if (n.includes('med') || n.includes('health') || n.includes('stim') || n.includes('potion') || n.includes('heal') || n.includes('bandage') || n.includes('kit')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  // Documents / Intel
  if (n.includes('note') || n.includes('paper') || n.includes('map') || n.includes('log') || n.includes('book') || n.includes('diary') || n.includes('file')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }

  // Tools / Misc
  if (n.includes('tool') || n.includes('wrench') || n.includes('driver') || n.includes('part') || n.includes('scrap')) {
     return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
     );
  }

  // Default Box / Cube
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ items, onClose, onInspect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="
          bg-gray-900/95 
          border border-white/10 
          rounded-3xl 
          p-6 
          max-w-md w-full 
          relative 
          shadow-[0_0_50px_rgba(79,70,229,0.15)] 
          flex flex-col 
          max-h-[70vh] 
          backdrop-blur-xl
          overflow-hidden
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-indigo-500/50 blur-[50px] pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-100 tracking-[0.2em] uppercase cinematic-text">Cargo Hold</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 relative z-10 px-1">
          {items.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 opacity-50 space-y-4">
               <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center border border-white/5">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                 </svg>
               </div>
               <p className="text-xs uppercase tracking-widest text-gray-500">Empty</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="
                    group relative 
                    bg-gradient-to-r from-gray-800/50 to-gray-900/50 
                    border border-white/5 
                    p-3 rounded-xl 
                    flex items-center justify-between 
                    hover:border-indigo-500/30 hover:bg-white/5 
                    transition-all duration-300 cursor-pointer
                    hover:shadow-[0_0_15px_rgba(79,70,229,0.1)]
                    active:scale-[0.98]
                  "
                  onClick={() => onInspect(item)}
                >
                  <div className="flex items-center gap-4">
                      {/* Icon Container */}
                      <div className="
                        w-12 h-12 rounded-lg 
                        bg-black/40 
                        flex items-center justify-center 
                        border border-white/5
                        group-hover:border-indigo-500/20
                        shadow-inner
                      ">
                        {getItemIcon(item)}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-medium tracking-wide text-sm group-hover:text-indigo-200 transition-colors">
                          {item}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Item</span>
                      </div>
                  </div>
                  
                  <div className="
                    opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 
                    transition-all duration-300
                    flex items-center
                  ">
                      <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/5 text-center flex justify-center">
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">Select to Inspect</p>
        </div>
      </div>
    </div>
  );
};