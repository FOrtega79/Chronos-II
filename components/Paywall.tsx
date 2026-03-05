import React, { useState } from 'react';
import { useMonetization } from '../context/MonetizationContext';

interface PaywallProps {
  onClose: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
  const { purchasePremium } = useMonetization();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = () => {
    setIsPurchasing(true);
    // Simulate network request for purchase
    setTimeout(() => {
      purchasePremium();
      setIsPurchasing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border border-purple-500/50 rounded-3xl p-8 max-w-lg w-full relative shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        <button onClick={onClose} disabled={isPurchasing} className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-50">✕</button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 cinematic-text mb-2">
            Chronos Premium
          </h2>
          <p className="text-gray-400">Experience the timeline without interruptions.</p>
        </div>

        <ul className="space-y-4 mb-8 text-gray-300">
          <li className="flex items-center"><span className="text-purple-400 mr-3">✓</span> No Ads</li>
          <li className="flex items-center"><span className="text-purple-400 mr-3">✓</span> Unlimited Tension Passes</li>
          <li className="flex items-center"><span className="text-purple-400 mr-3">✓</span> 4K Image Generation</li>
          <li className="flex items-center"><span className="text-purple-400 mr-3">✓</span> Support Independent Devs</li>
        </ul>

        <button 
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPurchasing ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Processing...</span>
            </>
          ) : (
            "Upgrade Now - $4.99"
          )}
        </button>
        
        <button onClick={onClose} disabled={isPurchasing} className="w-full mt-4 py-2 text-gray-500 text-sm hover:text-gray-300 disabled:opacity-50">
          Restore Purchases
        </button>
      </div>
    </div>
  );
};