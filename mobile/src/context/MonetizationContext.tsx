/**
 * MonetizationContext
 *
 * Wires together RevenueCat (subscriptions) and AdMob (rewarded ads).
 * Premium state is kept in sync with RevenueCat's CustomerInfo via a listener.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { CustomerInfo } from 'react-native-purchases';
import {
  checkPremiumStatus,
  addPurchaseListener,
  purchasePremium as rcPurchasePremium,
  restorePurchases as rcRestorePurchases,
  isPremiumActive,
} from '../services/revenueCatService';
import {
  preloadRewardedAd,
  showRewardedAd as admobShowAd,
  isAdReady,
} from '../services/admobService';

interface MonetizationContextType {
  isPremium: boolean;
  isAdShowing: boolean;
  showPaywallModal: boolean;
  isRestoringPurchases: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  showRewardedAd: (onComplete: () => void) => void;
  openPaywall: () => void;
  closePaywall: () => void;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(
  undefined
);

export const MonetizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);

  // Keep the ad-complete callback in a ref so the ad event listener
  // can call it even after the component re-renders.
  const adCompleteCallbackRef = useRef<(() => void) | null>(null);

  // ── On mount: check premium status & preload ad ────────────────────────────
  useEffect(() => {
    checkPremiumStatus().then(setIsPremium).catch(() => {});
    preloadRewardedAd();

    // Listen for real-time purchase updates (e.g. subscription renewed/expired)
    const removeListener = addPurchaseListener((info: CustomerInfo) => {
      setIsPremium(isPremiumActive(info));
    });

    return removeListener;
  }, []);

  // ── Purchase premium ────────────────────────────────────────────────────────
  const purchasePremium = useCallback(async () => {
    try {
      const granted = await rcPurchasePremium();
      if (granted) {
        setIsPremium(true);
        setShowPaywallModal(false);
      }
    } catch (err) {
      console.error('[Monetization] purchasePremium error:', err);
      throw err; // Let the UI handle displaying the error
    }
  }, []);

  // ── Restore purchases ───────────────────────────────────────────────────────
  const restorePurchases = useCallback(async () => {
    setIsRestoringPurchases(true);
    try {
      const granted = await rcRestorePurchases();
      setIsPremium(granted);
      if (granted) setShowPaywallModal(false);
    } catch (err) {
      console.error('[Monetization] restorePurchases error:', err);
      throw err;
    } finally {
      setIsRestoringPurchases(false);
    }
  }, []);

  // ── Show rewarded ad ────────────────────────────────────────────────────────
  const showRewardedAd = useCallback(
    (onComplete: () => void) => {
      // Premium users skip ads entirely
      if (isPremium) {
        onComplete();
        return;
      }

      adCompleteCallbackRef.current = onComplete;
      setIsAdShowing(true);

      const shown = admobShowAd({
        onRewarded: () => {
          // User earned the reward (watched the full ad)
          adCompleteCallbackRef.current?.();
          adCompleteCallbackRef.current = null;
        },
        onDismissed: () => {
          setIsAdShowing(false);
        },
        onError: (err) => {
          console.warn('[Monetization] Ad error:', err.message);
          setIsAdShowing(false);
          // Gracefully grant reward even if ad fails to avoid blocking player
          adCompleteCallbackRef.current?.();
          adCompleteCallbackRef.current = null;
        },
      });

      if (!shown) {
        // Ad was not ready — grant access anyway to avoid frustrating the user
        console.warn('[Monetization] Ad not ready — granting reward immediately.');
        setIsAdShowing(false);
        onComplete();
      }
    },
    [isPremium]
  );

  const openPaywall = useCallback(() => setShowPaywallModal(true), []);
  const closePaywall = useCallback(() => setShowPaywallModal(false), []);

  return (
    <MonetizationContext.Provider
      value={{
        isPremium,
        isAdShowing,
        showPaywallModal,
        isRestoringPurchases,
        purchasePremium,
        restorePurchases,
        showRewardedAd,
        openPaywall,
        closePaywall,
      }}
    >
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = (): MonetizationContextType => {
  const ctx = useContext(MonetizationContext);
  if (!ctx) throw new Error('useMonetization must be used within MonetizationProvider');
  return ctx;
};
