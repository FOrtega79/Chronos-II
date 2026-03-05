import React, { createContext, useContext, useState, useEffect } from 'react';

interface MonetizationContextType {
  isPremium: boolean;
  isAdShowing: boolean;
  showPaywallModal: boolean;
  purchasePremium: () => void;
  showRewardedAd: (onComplete: () => void) => void;
  openPaywall: () => void;
  closePaywall: () => void;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export const MonetizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // Load persistence
  useEffect(() => {
    const storedPremium = localStorage.getItem('chronos_premium');
    if (storedPremium === 'true') {
      setIsPremium(true);
    }
  }, []);

  const purchasePremium = () => {
    // Mock purchase logic
    setIsPremium(true);
    localStorage.setItem('chronos_premium', 'true');
    setShowPaywallModal(false);
  };

  const showRewardedAd = (onComplete: () => void) => {
    if (isPremium) {
      onComplete();
      return;
    }

    setIsAdShowing(true);
    // Mock Ad Duration
    setTimeout(() => {
      setIsAdShowing(false);
      onComplete();
    }, 5000); // 5 second ad
  };

  const openPaywall = () => setShowPaywallModal(true);
  const closePaywall = () => setShowPaywallModal(false);

  return (
    <MonetizationContext.Provider value={{ 
      isPremium, 
      isAdShowing, 
      showPaywallModal,
      purchasePremium, 
      showRewardedAd,
      openPaywall,
      closePaywall
    }}>
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = () => {
  const context = useContext(MonetizationContext);
  if (!context) throw new Error("useMonetization must be used within MonetizationProvider");
  return context;
};