/**
 * RevenueCat Service
 *
 * Handles all in-app purchase / subscription logic via RevenueCat.
 *
 * Setup steps:
 * 1. Create a RevenueCat account at https://app.revenuecat.com
 * 2. Add your iOS app and get your iOS API key
 * 3. Create an Entitlement called "premium" in the RevenueCat dashboard
 * 4. Create a Product in App Store Connect (subscription or one-time)
 * 5. Attach the product to the "premium" entitlement in RevenueCat
 * 6. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY in your .env.local
 */
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const PREMIUM_ENTITLEMENT = 'premium';

export function initRevenueCat(): void {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] API key not set — purchases will not work.');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.error('[RevenueCat] getOfferings error:', err);
    return null;
  }
}

export async function purchasePremium(): Promise<boolean> {
  try {
    const offering = await getCurrentOffering();
    if (!offering) throw new Error('No offerings available');

    // Use the first available package in the offering
    const pkg = offering.availablePackages[0];
    if (!pkg) throw new Error('No packages in offering');

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPremiumActive(customerInfo);
  } catch (err: any) {
    if (err?.userCancelled) {
      console.log('[RevenueCat] Purchase cancelled by user.');
      return false;
    }
    console.error('[RevenueCat] purchasePremium error:', err);
    throw err;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return isPremiumActive(customerInfo);
  } catch (err) {
    console.error('[RevenueCat] restorePurchases error:', err);
    throw err;
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isPremiumActive(customerInfo);
  } catch (err) {
    console.error('[RevenueCat] checkPremiumStatus error:', err);
    return false;
  }
}

export function isPremiumActive(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== 'undefined';
}

export function addPurchaseListener(
  callback: (info: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(callback);
  return () => Purchases.removeCustomerInfoUpdateListener(callback);
}
