import { describe, expect, it } from 'vitest';
import { CONSUMER_STORE_LISTING_IDS } from './consumer-store-listing.fixtures.js';
import { CONSUMER_STORE_SCREENSHOT_FRAMES } from './screenshot-spec.fixtures.js';
import { CONSUMER_STORE_PREVIEW_VIDEO_SCENES } from './preview-video.fixtures.js';
import { STORE_LISTING_LOCALES } from './store-listing.types.js';
import {
  buildConsumerStoreListingExportBundle,
  formatAppStoreConnectListing,
  formatGooglePlayListing,
  getConsumerStoreListing,
  listConsumerStoreListingLocales,
  validateAllConsumerStoreListings,
  validateConsumerStoreListing,
} from './store-listing.util.js';

describe('store-listing.util', () => {
  it.each(CONSUMER_STORE_LISTING_IDS)(
    'listing $id stays within platform character limits',
    ({ locale }) => {
      expect(validateConsumerStoreListing(getConsumerStoreListing(locale))).toEqual([]);
    },
  );

  it('lists supported locales', () => {
    expect(listConsumerStoreListingLocales()).toEqual(['en', 'hy', 'ru']);
  });

  it('validates all locales in one pass', () => {
    expect(validateAllConsumerStoreListings()).toEqual([]);
  });

  it.each(STORE_LISTING_LOCALES)('formats App Store Connect markdown for %s', (locale) => {
    const md = formatAppStoreConnectListing(getConsumerStoreListing(locale));
    expect(md).toContain('App Store Connect');
    expect(md).toContain(getConsumerStoreListing(locale).ios.title);
    expect(md).toContain(CONSUMER_STORE_SCREENSHOT_FRAMES[0]!.caption[locale]);
  });

  it.each(STORE_LISTING_LOCALES)('formats Google Play markdown for %s', (locale) => {
    const md = formatGooglePlayListing(getConsumerStoreListing(locale));
    expect(md).toContain('Google Play Console');
    expect(md).toContain(getConsumerStoreListing(locale).android.title);
  });

  it('builds export bundle with EN/HY/RU listings and creative specs', () => {
    const bundle = buildConsumerStoreListingExportBundle();
    expect(bundle.locales).toEqual(['en', 'hy', 'ru']);
    expect(bundle.screenshots).toHaveLength(5);
    expect(bundle.previewVideo.scenes).toHaveLength(CONSUMER_STORE_PREVIEW_VIDEO_SCENES.length);
    expect(bundle.markdown.en.appStoreConnect).toContain('OptiSchedule');
    expect(bundle.markdown.hy.googlePlay).toContain('Սրահ');
    expect(bundle.markdown.ru.appStoreConnect).toContain('Запись');
  });

  it('reports limit violations when copy exceeds caps', () => {
    const listing = getConsumerStoreListing('en');
    const violations = validateConsumerStoreListing({
      ...listing,
      ios: { ...listing.ios, title: 'x'.repeat(31) },
    });
    expect(violations).toEqual([
      { locale: 'en', field: 'ios.title', limit: 30, length: 31 },
    ]);
  });
});
