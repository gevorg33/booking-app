import { describe, expect, it, vi } from 'vitest';
import { buildTenantAppInstallUrl } from './deferred-install-link.util';
import {
  buildTenantAppInstallQrFilename,
  downloadTenantAppInstallQrPng,
  renderTenantAppInstallQrDataUrl,
  shouldShowTenantAppInstallQr,
} from './tenant-app-install.util';

describe('tenant-app-install.util', () => {
  it('buildTenantAppInstallQrFilename encodes slug and campaign', () => {
    expect(buildTenantAppInstallQrFilename('salon-a', 'venue_qr')).toBe(
      'optischedule-salon-a-venue_qr.png',
    );
    expect(buildTenantAppInstallQrFilename('salon-a', 'confirmation_qr')).toBe(
      'optischedule-salon-a-confirmation_qr.png',
    );
  });

  it('shouldShowTenantAppInstallQr requires at least one store URL', () => {
    expect(shouldShowTenantAppInstallQr('', '')).toBe(false);
    expect(shouldShowTenantAppInstallQr('https://apps.apple.com/id1', '')).toBe(true);
    expect(shouldShowTenantAppInstallQr('', 'https://play.google.com/store/apps/details?id=x')).toBe(
      true,
    );
  });

  it('buildTenantAppInstallUrl scopes confirmation campaign with service', () => {
    expect(
      buildTenantAppInstallUrl('https://app.test', 'salon-a', {
        serviceId: 'svc-1',
        campaign: 'confirmation_qr',
      }),
    ).toBe(
      'https://app.test/get-app/salon-a?src=qr&utm_campaign=confirmation_qr&serviceId=svc-1',
    );
  });

  it('renderTenantAppInstallQrDataUrl returns a PNG data URL', async () => {
    const dataUrl = await renderTenantAppInstallQrDataUrl(
      'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
    );
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('downloadTenantAppInstallQrPng triggers a download anchor', async () => {
    const click = vi.fn();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        createElement: () => ({
          href: '',
          download: '',
          rel: '',
          click,
          remove: vi.fn(),
        }),
      },
    });
    await downloadTenantAppInstallQrPng(
      'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
      'optischedule-salon-a-venue_qr.png',
    );
    expect(click).toHaveBeenCalled();
  });
});
