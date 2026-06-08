# OptiSchedule Consumer App

Native customer booking app (`com.optischedule.consumer`), separate from `provider-app/`.

## Features (Sprint 11)

- Capacitor + Ionic React: book services, Google sign-in, account (bookings + subscriptions)
- Per-tenant context: routes under `/s/{slug}`, auth tokens keyed by slug
- Deep links: `https://your-domain/book/{slug}`, `optischedule://book/{slug}`, deferred slug after store install
- Clinic lab booking: `optischedule://book/{slug}/lab-requests?serviceId={id}&clinicOrderToken={token}` opens collection booking with token prefill; without query params opens the **Lab to book** tab (`/s/{slug}/lab-to-book`). Native push (clinic tenants): FCM/APNs via `@capacitor/push-notifications` + `/public/:slug/me/push/register-native`.
- Recent salons on welcome when no deep link
- **Customer self-service (gap-2.7):** cancel/reschedule on Account; manage link (`/book/{slug}/manage?bookingId=&token=`); confirmation card shows previous vs new time
- **iOS** Universal Links + **Android** App Links (same web paths)

## Development

```bash
cd consumer-app
npm install
cp .env.example .env   # or: bash scripts/prepare-env.sh
npm run dev            # http://127.0.0.1:5174
```

Point `VITE_API_URL` at the backend. On the Android emulator, `public-api.ts` maps `127.0.0.1` → `10.0.2.2` automatically.

## iOS

```bash
npm run cap:add:ios    # once
# Add ios/App/App/GoogleService-Info.plist (bundle: com.optischedule.consumer)
CONSUMER_UNIVERSAL_LINK_HOST=your-public-host \
  bash scripts/configure-ios-universal-links.sh
npm run build:ios:lan
npm run cap:ios
```

Also configure Universal Links on the web host (adopt-2.6):

```bash
cd frontend
# Set CONSUMER_APPLE_TEAM_ID + CONSUMER_ANDROID_SHA256_FINGERPRINTS in .env.local
npm run generate:well-known
```

Next.js serves `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` at runtime with `Content-Type: application/json`. Verified https links on `/book/*` and `/s/*` open the app directly; when the app is not installed the same URL loads public booking web.

## Android

```bash
npm run cap:add:android   # once
# Firebase Console → Android app → package com.optischedule.consumer
# Download google-services.json → android/app/google-services.json
# Add SHA-1 / SHA-256 of your signing key for Google Sign-In

CONSUMER_UNIVERSAL_LINK_HOST=your-public-host \
  bash scripts/configure-android-app-links.sh
npm run build:android:lan
npm run cap:android
```

**App Links verification**

1. Set env on the frontend host and generate files:

   ```bash
   cd frontend
   CONSUMER_APPLE_TEAM_ID=YOUR_TEAM_ID \
   CONSUMER_ANDROID_SHA256_FINGERPRINTS='AA:BB:...' \
     npm run generate:well-known
   npm run verify:app-links
   ```

   Or rely on Next.js route handlers (`frontend/src/app/.well-known/*/route.ts`) when `CONSUMER_*` env vars are set in production.

2. Host must match `CONSUMER_UNIVERSAL_LINK_HOST` and serve `assetlinks.json` over HTTPS with `Content-Type: application/json`.

Debug keystore fingerprint:

   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
   ```

**Custom scheme** (works without domain verification): `optischedule://book/{slug}`

## Web integration

Set on the Next.js app:

- `NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL`
- `NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL`

Public booking banner shows platform-appropriate store buttons + “Open in app”.

## Tests

```bash
npm run test:sprint11
npm run test:aso          # adopt-2.1 store listing limits + export
npm run store-listings:export   # writes store-listings/generated/
```
