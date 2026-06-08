import { CONSUMER_STORE_LISTINGS } from './consumer-store-listing.fixtures.js';
import { CONSUMER_STORE_PREVIEW_VIDEO_SCENES, CONSUMER_PREVIEW_VIDEO_SPEC } from './preview-video.fixtures.js';
import {
  CONSUMER_SCREENSHOT_EXPORT_SIZES,
  CONSUMER_STORE_SCREENSHOT_FRAMES,
} from './screenshot-spec.fixtures.js';
import {
  STORE_LISTING_LIMITS,
  STORE_LISTING_LOCALES,
  type ConsumerStoreListing,
  type StoreListingLimitViolation,
  type StoreListingLocale,
} from './store-listing.types.js';

export function getConsumerStoreListing(locale: StoreListingLocale): ConsumerStoreListing {
  return CONSUMER_STORE_LISTINGS[locale];
}

export function listConsumerStoreListingLocales(): readonly StoreListingLocale[] {
  return STORE_LISTING_LOCALES;
}

function pushViolation(
  violations: StoreListingLimitViolation[],
  locale: StoreListingLocale,
  field: string,
  limit: number,
  value: string,
): void {
  if (value.length > limit) {
    violations.push({ locale, field, limit, length: value.length });
  }
}

export function validateConsumerStoreListing(
  listing: ConsumerStoreListing,
): StoreListingLimitViolation[] {
  const { locale, ios, android } = listing;
  const violations: StoreListingLimitViolation[] = [];

  pushViolation(violations, locale, 'ios.title', STORE_LISTING_LIMITS.iosTitle, ios.title);
  pushViolation(violations, locale, 'ios.subtitle', STORE_LISTING_LIMITS.iosSubtitle, ios.subtitle);
  pushViolation(violations, locale, 'ios.keywords', STORE_LISTING_LIMITS.iosKeywords, ios.keywords);
  pushViolation(
    violations,
    locale,
    'ios.promotionalText',
    STORE_LISTING_LIMITS.iosPromotionalText,
    ios.promotionalText,
  );
  pushViolation(
    violations,
    locale,
    'ios.description',
    STORE_LISTING_LIMITS.iosDescription,
    ios.description,
  );
  pushViolation(violations, locale, 'android.title', STORE_LISTING_LIMITS.androidTitle, android.title);
  pushViolation(
    violations,
    locale,
    'android.shortDescription',
    STORE_LISTING_LIMITS.androidShortDescription,
    android.shortDescription,
  );
  pushViolation(
    violations,
    locale,
    'android.fullDescription',
    STORE_LISTING_LIMITS.androidFullDescription,
    android.fullDescription,
  );

  return violations;
}

export function validateAllConsumerStoreListings(): StoreListingLimitViolation[] {
  return STORE_LISTING_LOCALES.flatMap((locale) =>
    validateConsumerStoreListing(getConsumerStoreListing(locale)),
  );
}

export function formatAppStoreConnectListing(listing: ConsumerStoreListing): string {
  const { ios } = listing;
  return [
    `# App Store Connect — ${listing.locale.toUpperCase()}`,
    '',
    '## App Information',
    `- **Name:** ${ios.title}`,
    `- **Subtitle:** ${ios.subtitle}`,
    `- **Keywords:** ${ios.keywords}`,
    '',
    '## Promotional Text',
    ios.promotionalText,
    '',
    '## Description',
    ios.description,
    '',
    '## Screenshots',
    ...CONSUMER_STORE_SCREENSHOT_FRAMES.map(
      (frame, index) => `${index + 1}. **${frame.id}** — ${frame.caption[listing.locale]}`,
    ),
    '',
    '## App Preview Video',
    ...CONSUMER_STORE_PREVIEW_VIDEO_SCENES.map(
      (scene) =>
        `- ${scene.startSec}s–${scene.endSec}s: ${scene.visual[listing.locale]} (on-screen: "${scene.onScreenText[listing.locale]}")`,
    ),
  ].join('\n');
}

export function formatGooglePlayListing(listing: ConsumerStoreListing): string {
  const { android } = listing;
  return [
    `# Google Play Console — ${listing.locale.toUpperCase()}`,
    '',
    '## Store Listing',
    `- **Title:** ${android.title}`,
    `- **Short description:** ${android.shortDescription}`,
    '',
    '## Full description',
    android.fullDescription,
    '',
    '## Phone screenshots',
    ...CONSUMER_STORE_SCREENSHOT_FRAMES.map(
      (frame, index) => `${index + 1}. **${frame.id}** — ${frame.caption[listing.locale]}`,
    ),
    '',
    '## Feature video',
    `Duration: ${CONSUMER_PREVIEW_VIDEO_SPEC.durationSec}s · Aspect: ${CONSUMER_PREVIEW_VIDEO_SPEC.aspectRatio}`,
    ...CONSUMER_STORE_PREVIEW_VIDEO_SCENES.map(
      (scene) =>
        `- ${scene.startSec}s–${scene.endSec}s: ${scene.visual[listing.locale]}`,
    ),
  ].join('\n');
}

export interface ConsumerStoreListingExportBundle {
  appId: string;
  packageName: string;
  locales: StoreListingLocale[];
  listings: Record<StoreListingLocale, ConsumerStoreListing>;
  screenshots: typeof CONSUMER_STORE_SCREENSHOT_FRAMES;
  screenshotSizes: typeof CONSUMER_SCREENSHOT_EXPORT_SIZES;
  previewVideo: {
    spec: typeof CONSUMER_PREVIEW_VIDEO_SPEC;
    scenes: typeof CONSUMER_STORE_PREVIEW_VIDEO_SCENES;
  };
  markdown: Record<
    StoreListingLocale,
    { appStoreConnect: string; googlePlay: string }
  >;
}

export function buildConsumerStoreListingExportBundle(): ConsumerStoreListingExportBundle {
  const listings = { ...CONSUMER_STORE_LISTINGS };
  const markdown = Object.fromEntries(
    STORE_LISTING_LOCALES.map((locale) => {
      const listing = listings[locale];
      return [
        locale,
        {
          appStoreConnect: formatAppStoreConnectListing(listing),
          googlePlay: formatGooglePlayListing(listing),
        },
      ];
    }),
  ) as ConsumerStoreListingExportBundle['markdown'];

  return {
    appId: 'com.optischedule.consumer',
    packageName: 'com.optischedule.consumer',
    locales: [...STORE_LISTING_LOCALES],
    listings,
    screenshots: CONSUMER_STORE_SCREENSHOT_FRAMES,
    screenshotSizes: CONSUMER_SCREENSHOT_EXPORT_SIZES,
    previewVideo: {
      spec: CONSUMER_PREVIEW_VIDEO_SPEC,
      scenes: CONSUMER_STORE_PREVIEW_VIDEO_SCENES,
    },
    markdown,
  };
}
