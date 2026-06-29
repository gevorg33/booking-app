import {
  buildTenantAppCustomSchemeUrl,
  buildTenantAppInstallLandingUrl,
  mergeTenantAppInstallIntoSettings,
  readTenantAppInstallSettings,
  toTenantAppInstallView,
} from './tenant-app-install-settings.util.js';

describe('tenant-app-install-settings.util', () => {
  it('buildTenantAppInstallLandingUrl returns get-app path with attribution', () => {
    expect(buildTenantAppInstallLandingUrl('https://app.test/', 'Glow-Nails')).toBe(
      'https://app.test/get-app/glow-nails?src=qr&utm_campaign=venue_qr',
    );
    expect(
      buildTenantAppInstallLandingUrl('https://app.test', 'spa-one', {
        campaign: 'confirmation_qr',
        installSource: 'referral',
      }),
    ).toBe(
      'https://app.test/get-app/spa-one?src=referral&utm_campaign=confirmation_qr',
    );
  });

  it('buildTenantAppInstallLandingUrl rejects invalid slug', () => {
    expect(buildTenantAppInstallLandingUrl('https://app.test', 'bad slug')).toBeNull();
  });

  it('buildTenantAppCustomSchemeUrl scopes tenant slug', () => {
    expect(buildTenantAppCustomSchemeUrl('Salon-A')).toBe('optischedule://book/salon-a');
  });

  it('readTenantAppInstallSettings validates stored shape', () => {
    expect(readTenantAppInstallSettings(null)).toBeNull();
    expect(readTenantAppInstallSettings({ appInstall: { landingUrl: 'x' } })).toBeNull();
    const stored = {
      landingUrl: 'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
      qrDataUrl: 'data:image/png;base64,abc',
      generatedAt: '2026-06-01T00:00:00.000Z',
    };
    expect(readTenantAppInstallSettings({ appInstall: stored })).toEqual(stored);
  });

  it('mergeTenantAppInstallIntoSettings preserves other settings keys', () => {
    const merged = mergeTenantAppInstallIntoSettings(
      { timezone: 'UTC' },
      {
        landingUrl: 'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
        qrDataUrl: 'data:image/png;base64,abc',
        generatedAt: '2026-06-01T00:00:00.000Z',
      },
    );
    expect(merged.timezone).toBe('UTC');
    expect(readTenantAppInstallSettings(merged)?.landingUrl).toContain('/get-app/salon-a');
  });

  it('toTenantAppInstallView exposes custom scheme URL', () => {
    const view = toTenantAppInstallView('salon-a', {
      landingUrl: 'https://app.test/get-app/salon-a?src=qr&utm_campaign=venue_qr',
      qrDataUrl: 'data:image/png;base64,abc',
      generatedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(view.customSchemeUrl).toBe('optischedule://book/salon-a');
    expect(view.slug).toBe('salon-a');
  });
});
