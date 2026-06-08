import { describe, expect, it } from 'vitest';
import {
  CONSUMER_APP_BANNER_SERVICE_ID_SCENARIOS,
  CONSUMER_APP_BANNER_STORE_SCENARIOS,
} from './consumer-app-banner.fixtures';
import {
  buildConsumerAppBannerDismissKey,
  buildConsumerAppBannerOpenInAppUrls,
  buildConsumerAppBannerStoreUrl,
  buildDeferredLinkForBanner,
  resolveConsumerAppBannerStoreButtons,
  resolvePublicBookingBannerServiceId,
} from './consumer-app-banner.util';

describe('consumer-app-banner.util', () => {
  it('builds per-tenant dismiss key', () => {
    expect(buildConsumerAppBannerDismissKey('glow-nails')).toBe(
      'consumer_banner_dismiss_glow-nails',
    );
  });

  it('builds deferred link with web_banner source and campaign', () => {
    expect(
      buildDeferredLinkForBanner({
        slug: 'salon-a',
        serviceId: 'svc-1',
        capturedAt: '2026-06-01T00:00:00.000Z',
      }),
    ).toEqual({
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'web_banner',
      campaign: 'public_booking_banner',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it.each(CONSUMER_APP_BANNER_SERVICE_ID_SCENARIOS)(
    'resolvePublicBookingBannerServiceId $id',
    ({ params, expected }) => {
      expect(resolvePublicBookingBannerServiceId(params)).toBe(expected);
    },
  );

  it.each(CONSUMER_APP_BANNER_STORE_SCENARIOS)(
    'resolveConsumerAppBannerStoreButtons $id',
    ({ platform, iosUrl, androidUrl, showIos, showAndroid }) => {
      expect(resolveConsumerAppBannerStoreButtons(platform, iosUrl, androidUrl)).toEqual({
        showIosDownload: showIos,
        showAndroidDownload: showAndroid,
      });
    },
  );

  it('builds universal and custom scheme open-in-app URLs with service attribution', () => {
    const link = buildDeferredLinkForBanner({
      slug: 'salon-a',
      serviceId: 'svc-42',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
    const urls = buildConsumerAppBannerOpenInAppUrls('https://app.test', link);
    expect(urls.universalUrl).toBe(
      'https://app.test/book/salon-a?serviceId=svc-42&src=web_banner&utm_campaign=public_booking_banner',
    );
    expect(urls.customSchemeUrl).toBe(
      'optischedule://book/salon-a?serviceId=svc-42&src=web_banner&utm_campaign=public_booking_banner',
    );
    expect(urls.webFallbackUrl).toBe(urls.universalUrl);
  });

  it('appends attribution params to store URL', () => {
    const link = buildDeferredLinkForBanner({
      slug: 'salon-a',
      serviceId: 'svc-1',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
    const url = buildConsumerAppBannerStoreUrl('https://apps.apple.com/app/id123', link);
    expect(url).toContain('slug=salon-a');
    expect(url).toContain('serviceId=svc-1');
    expect(url).toContain('src=web_banner');
  });

  it('builds open-in-app URLs with slot resume params (n99-3.1)', () => {
    const link = buildDeferredLinkForBanner({
      slug: 'salon-a',
      serviceId: 'svc-42',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      capturedAt: '2026-06-01T00:00:00.000Z',
    });
    const urls = buildConsumerAppBannerOpenInAppUrls('https://app.test', link);
    expect(urls.universalUrl).toContain('serviceId=svc-42');
    expect(urls.universalUrl).toContain('date=2026-06-10');
    expect(urls.universalUrl).toContain('slot=2026-06-10T14%3A00%3A00.000Z');
  });
});
