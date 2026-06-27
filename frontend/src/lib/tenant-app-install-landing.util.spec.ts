import { describe, expect, it } from 'vitest';
import {
  appendStoreSlugParam,
  buildTenantAppInstallLandingPath,
  buildTenantAppInstallLandingUrl,
  resolveTenantAppInstallRedirect,
} from './tenant-app-install-landing.util';

describe('tenant-app-install-landing.util', () => {
  it('buildTenantAppInstallLandingPath normalizes slug', () => {
    expect(buildTenantAppInstallLandingPath('Glow-Nails')).toBe('/get-app/glow-nails');
  });

  it('buildTenantAppInstallLandingUrl adds attribution params', () => {
    expect(buildTenantAppInstallLandingUrl('https://app.test', 'salon-a')).toBe(
      'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
    );
    expect(
      buildTenantAppInstallLandingUrl('https://app.test', 'salon-a', {
        serviceId: 'svc-1',
        campaign: 'confirmation_qr',
        installSource: 'referral',
      }),
    ).toBe(
      'https://app.test/get-app/salon-a?src=referral&utm_campaign=confirmation_qr&serviceId=svc-1',
    );
  });

  it('appendStoreSlugParam adds slug query param', () => {
    expect(appendStoreSlugParam('https://apps.apple.com/app/id1', 'salon-a')).toBe(
      'https://apps.apple.com/app/id1?slug=salon-a',
    );
    expect(
      appendStoreSlugParam('https://play.google.com/store/apps/details?id=x&hl=en', 'salon-a'),
    ).toContain('slug=salon-a');
  });

  it('resolveTenantAppInstallRedirect prefers custom scheme with store fallback', () => {
    expect(
      resolveTenantAppInstallRedirect('ios', {
        slug: 'salon-a',
        iosStoreUrl: 'https://apps.apple.com/app/id1',
        androidStoreUrl: '',
        customSchemeUrl: 'optischedule://book/salon-a',
      }),
    ).toEqual({
      primary: 'optischedule://book/salon-a',
      fallback: 'https://apps.apple.com/app/id1?slug=salon-a',
    });
    expect(
      resolveTenantAppInstallRedirect('other', {
        slug: 'salon-a',
        iosStoreUrl: 'https://apps.apple.com/app/id1',
        androidStoreUrl: 'https://play.google.com/store/apps/details?id=x',
        customSchemeUrl: 'optischedule://book/salon-a',
      }),
    ).toBeNull();
  });
});
