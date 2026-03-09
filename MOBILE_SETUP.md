# Chronos — iOS Mobile App Setup Guide

## Overview

```
Chronos-II/
├── mobile/          ← Expo React Native app (iOS + Android)
├── cloudflare-worker/  ← Gemini API proxy (keeps API key secure)
└── (web app files)  ← Original React web app (unchanged)
```

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js 18+ | Runtime | https://nodejs.org |
| EAS CLI | Cloud builds | `npm install -g eas-cli` |
| Wrangler CLI | Cloudflare Worker | `npm install -g wrangler` |
| Apple Developer Account | iOS distribution | https://developer.apple.com ($99/yr) |
| Google AdMob Account | Rewarded ads | https://admob.google.com (free) |
| RevenueCat Account | Subscriptions | https://app.revenuecat.com (free tier) |

> **No Xcode required** — EAS Build compiles iOS binaries in the cloud.

---

## Step 1: Deploy the Cloudflare Worker

The worker keeps your Gemini API key server-side. It's free for ~100,000 requests/day.

```bash
cd cloudflare-worker
npm install

# Log into Cloudflare (creates a free account if needed)
wrangler login

# Store your Gemini API key as an encrypted secret
wrangler secret put GEMINI_API_KEY
# → paste your key when prompted

# Deploy the worker
wrangler deploy
```

Note the Worker URL printed after deploy — looks like:
`https://chronos-api.YOUR-SUBDOMAIN.workers.dev`

---

## Step 2: Configure the Mobile App

```bash
cd mobile
cp .env.example .env.local
```

Edit `.env.local`:

```env
EXPO_PUBLIC_API_BASE_URL=https://chronos-api.YOUR-SUBDOMAIN.workers.dev

# From https://app.revenuecat.com → your app → API Keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxx

# From https://admob.google.com → your app → Ad units
EXPO_PUBLIC_ADMOB_REWARDED_AD_IOS=ca-app-pub-xxxx/xxxx
```

---

## Step 3: Configure app.json

Open `mobile/app.json` and update:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.YOURCOMPANY.chronos"
    },
    "plugins": [
      ["react-native-google-mobile-ads", {
        "iosAppId": "ca-app-pub-xxxx~xxxx"   ← Your AdMob App ID (not ad unit ID)
      }]
    ]
  }
}
```

---

## Step 4: Set Up RevenueCat

1. Create account at https://app.revenuecat.com
2. Add your iOS app with your bundle ID
3. Create an **Entitlement** named `premium`
4. Create a **Product** in App Store Connect (subscription or one-time)
5. Link the product to the `premium` entitlement
6. Copy your iOS API key → `.env.local`

---

## Step 5: Set Up AdMob

1. Create account at https://admob.google.com
2. Add your iOS app → get **App ID** (format: `ca-app-pub-xxxx~xxxx`)
3. Create a **Rewarded** ad unit → get **Ad Unit ID** (format: `ca-app-pub-xxxx/xxxx`)
4. Update `app.json` with the App ID
5. Update `.env.local` with the Ad Unit ID

> During development, test ads are used automatically (no setup needed).

---

## Step 6: Install Dependencies and Build

```bash
cd mobile
npm install

# Log into Expo account (free)
eas login

# Configure EAS (run once — sets up your app in Expo's build system)
eas build:configure

# iOS development build (runs on simulator via EAS)
eas build --platform ios --profile development

# iOS production build (for App Store submission)
eas build --platform ios --profile production
```

### EAS Free Tier Limits
- 30 builds/month on the free tier
- Use `development` profile for testing
- Use `production` only when ready to submit

---

## Step 7: Submit to App Store

```bash
# After a successful production build:
eas submit --platform ios
```

EAS Submit will prompt for your Apple credentials and upload directly to App Store Connect.

---

## Step 8: Update eas.json

Open `mobile/eas.json` and fill in your Apple details:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.email",
        "ascAppId": "1234567890",      ← From App Store Connect
        "appleTeamId": "XXXXXXXXXX"    ← From developer.apple.com
      }
    }
  }
}
```

---

## Development Workflow (No Mac Required)

```
1. Edit code on any computer
2. Push to git
3. Run: eas build --platform ios --profile development
4. Wait ~15 min for cloud build
5. EAS sends download link for the .ipa
6. Install via TestFlight (requires Apple Dev account) or Expo Go (limited)
```

For rapid iteration, use Expo Go on your iPhone to test the JS layer without a full build. Note: Expo Go cannot load custom native modules (AdMob, RevenueCat) — use EAS development builds for those.

---

## App Store Requirements Checklist

Before submitting:
- [ ] App icons added to `mobile/assets/` (1024×1024 PNG)
- [ ] Splash screen added to `mobile/assets/`
- [ ] Privacy Policy URL (required for apps with ads + IAP)
- [ ] App Store screenshots (6.5" iPhone)
- [ ] Bundle ID matches App Store Connect
- [ ] AdMob App ID in `app.json`
- [ ] `NSUserTrackingUsageDescription` in `app.json` (already set)
- [ ] RevenueCat entitlement `premium` created
- [ ] Products approved in App Store Connect (can take 24-48h)

---

## Architecture Diagram

```
iPhone App (React Native / Expo)
    │
    ├── Story/Image/TTS requests
    │       ↓
    │   Cloudflare Worker (free proxy)
    │       ↓
    │   Google Gemini API
    │
    ├── Purchases / Subscriptions
    │       ↓
    │   RevenueCat SDK → Apple App Store
    │
    └── Rewarded Ads
            ↓
        Google AdMob SDK (native)
```

---

## Costs (Minimal Setup)

| Service | Free Tier | Paid |
|---------|-----------|------|
| EAS Build | 30 builds/month | $29/month for more |
| Cloudflare Worker | 100k req/day | $5/month |
| RevenueCat | Up to $2.5k MRR | 1% of revenue after |
| AdMob | Free | Revenue share |
| Apple Developer | — | $99/year (required) |
| Gemini API | Free quota | Pay-per-use after |
