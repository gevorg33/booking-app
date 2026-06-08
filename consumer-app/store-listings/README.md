# Consumer app — App Store / Play Store listings (ASO)

Structured listing copy for **adopt-2.1** / **gap-2.5.10** (consumer app; provider app is **gap-1.5**).

## Locales

| Locale | iOS title | Play title |
|--------|-----------|------------|
| EN | OptiSchedule — Book Salons | OptiSchedule — Book Salons |
| HY | OptiSchedule — Սրահ ամրագրում | OptiSchedule — Սրահ ամրագրում |
| RU | OptiSchedule — Запись в салон | OptiSchedule — Запись в салон |

## Source files

| File | Purpose |
|------|---------|
| `consumer-store-listing.fixtures.ts` | Localized titles, keywords, descriptions (EN/HY/RU) |
| `screenshot-spec.fixtures.ts` | 5 screenshot frames + export dimensions |
| `preview-video.fixtures.ts` | 30s preview video storyboard |
| `store-listing.util.ts` | Validation, markdown export, bundle builder |
| `store-listing.types.ts` | Platform field limits and types |

## Commands

```bash
cd consumer-app

# Validate limits + unit tests
npm run test:aso

# Regenerate upload-ready JSON + markdown under generated/
npm run store-listings:export
```

Output layout:

```
store-listings/generated/
  bundle.json
  en/listing.json, app-store-connect.md, google-play.md
  hy/...
  ru/...
```

## Screenshot capture

1. Run the app on simulator/device with demo tenant `glow-nails` (or your staging slug).
2. Capture each frame in `screenshot-spec.fixtures.ts` at the listed route.
3. Export at sizes in `CONSUMER_SCREENSHOT_EXPORT_SIZES` (6.7" iPhone, 6.5" iPhone, Android phone, 7" tablet).
4. Overlay caption text per locale in App Store Connect / Play Console (or burn into PNGs for marketing).

## Preview video

Follow `preview-video.fixtures.ts` scene timing (30s, 9:16). Record on device; no PHI or real customer data.

## Store URLs (web + app CTAs)

Set in `consumer-app/.env` and Next.js:

- `VITE_IOS_APP_STORE_URL` / `NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL`
- `VITE_ANDROID_PLAY_STORE_URL` / `NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL`

## Pre-submission checklist

- [ ] All three locales uploaded in App Store Connect + Play Console
- [ ] Screenshots (5 frames × 3 locales × required device sizes)
- [ ] Preview / feature video per locale (optional but recommended)
- [ ] Privacy policy URL matches dashboard compliance page
- [ ] `apple-app-site-association` TEAMID + `assetlinks.json` SHA-256 updated
