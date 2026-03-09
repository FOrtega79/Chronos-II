/**
 * AdMob Service — Rewarded Ads
 *
 * Setup steps:
 * 1. Create a Google AdMob account at https://admob.google.com
 * 2. Create an app in AdMob and get your App ID
 * 3. Add the App ID to app.json under the react-native-google-mobile-ads plugin
 * 4. Create a Rewarded Ad unit and copy the ad unit ID
 * 5. Set EXPO_PUBLIC_ADMOB_REWARDED_AD_IOS in your .env.local
 *
 * During development, TestIds.REWARDED is used automatically.
 */
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
  RequestOptions,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const IOS_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_IOS ?? TestIds.REWARDED;
const ANDROID_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_ANDROID ?? TestIds.REWARDED;

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
  ? IOS_UNIT_ID
  : ANDROID_UNIT_ID;

// Singleton ad instance — preloaded for fast display
let rewardedAd: RewardedAd | null = null;
let adLoaded = false;

const REQUEST_OPTIONS: RequestOptions = {
  requestNonPersonalizedAdsOnly: false,
};

function createAndLoadAd(): void {
  rewardedAd = RewardedAd.createForAdRequest(adUnitId, REQUEST_OPTIONS);

  const unsubscribeLoaded = rewardedAd.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      adLoaded = true;
      console.log('[AdMob] Rewarded ad loaded and ready.');
    }
  );

  const unsubscribeError = rewardedAd.addAdEventListener(
    AdEventType.ERROR,
    (err) => {
      console.warn('[AdMob] Rewarded ad failed to load:', err.message);
      adLoaded = false;
      // Retry loading after a short delay
      setTimeout(() => createAndLoadAd(), 5000);
    }
  );

  rewardedAd.load();
}

/** Call once at app startup to preload the first ad. */
export function preloadRewardedAd(): void {
  createAndLoadAd();
}

/**
 * Show a rewarded ad. Calls `onRewarded` when the user earns the reward,
 * and `onDismissed` when the ad closes (regardless of reward).
 * Returns false immediately if no ad is ready.
 */
export function showRewardedAd(params: {
  onRewarded: () => void;
  onDismissed: () => void;
  onError: (err: Error) => void;
}): boolean {
  if (!rewardedAd || !adLoaded) {
    console.warn('[AdMob] Ad not ready yet — preloading.');
    preloadRewardedAd();
    return false;
  }

  adLoaded = false; // Mark as consumed

  const unsubscribeRewarded = rewardedAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      params.onRewarded();
    }
  );

  const unsubscribeClosed = rewardedAd.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      params.onDismissed();
      // Preload the next ad immediately after the current one is dismissed
      createAndLoadAd();
    }
  );

  const unsubscribeError = rewardedAd.addAdEventListener(
    AdEventType.ERROR,
    (err) => {
      params.onError(err);
      createAndLoadAd();
    }
  );

  rewardedAd.show().catch((err) => {
    params.onError(err);
    createAndLoadAd();
  });

  return true;
}

export function isAdReady(): boolean {
  return adLoaded;
}
