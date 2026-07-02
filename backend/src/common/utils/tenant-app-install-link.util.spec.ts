import {
  TENANT_APP_INSTALL_INVALID_SLUG_SCENARIOS,
  TENANT_APP_INSTALL_URL_SCENARIOS,
} from './tenant-app-install-link.fixtures.js';
import {
  buildTenantAppInstallEmailBlocks,
  buildTenantAppInstallLinkHtml,
  buildTenantAppInstallLinkText,
  buildTenantAppInstallQrDataUrl,
  buildTenantAppInstallUrl,
  emptyTenantAppInstallEmailBlocks,
  isValidTenantSlug,
} from './tenant-app-install-link.util.js';

describe('tenant-app-install-link.util', () => {
  it.each(TENANT_APP_INSTALL_URL_SCENARIOS)(
    'buildTenantAppInstallUrl $id',
    ({ frontendUrl, slug, serviceId, campaign, rootDomain, expectedUrl }) => {
      expect(
        buildTenantAppInstallUrl(frontendUrl, slug, {
          serviceId,
          campaign,
          rootDomain,
        }),
      ).toBe(expectedUrl);
    },
  );

  it.each(TENANT_APP_INSTALL_INVALID_SLUG_SCENARIOS)(
    'rejects invalid slug $id',
    ({ slug }) => {
      expect(buildTenantAppInstallUrl('https://app.test', slug)).toBeNull();
      expect(isValidTenantSlug(slug)).toBe(false);
    },
  );

  it('builds localized plain-text and HTML promo blocks', () => {
    const url =
      'https://app.test/book/salon-a?src=qr&utm_campaign=confirmation_qr';
    expect(buildTenantAppInstallLinkText(url, 'en')).toContain(url);
    expect(
      buildTenantAppInstallLinkHtml(url, 'en', 'data:image/png;base64,abc'),
    ).toContain('Get the OptiSchedule app');
    expect(buildTenantAppInstallLinkHtml(url, 'en', null)).not.toContain(
      '<img',
    );
  });

  it('buildTenantAppInstallQrDataUrl returns a PNG data URL', async () => {
    const dataUrl = await buildTenantAppInstallQrDataUrl(
      'https://app.test/book/salon-a?src=qr',
    );
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('buildTenantAppInstallEmailBlocks returns empty strings for invalid slug', async () => {
    await expect(
      buildTenantAppInstallEmailBlocks({
        frontendUrl: 'https://app.test',
        slug: 'bad slug',
        campaign: 'confirmation_qr',
        locale: 'en',
      }),
    ).resolves.toEqual(emptyTenantAppInstallEmailBlocks());
  });

  it('buildTenantAppInstallEmailBlocks embeds QR when includeQr is true', async () => {
    const blocks = await buildTenantAppInstallEmailBlocks({
      frontendUrl: 'https://app.test',
      slug: 'salon-a',
      serviceId: 'svc-1',
      campaign: 'receipt_qr',
      locale: 'en',
      includeQr: true,
    });
    expect(blocks.appInstallLinkText).toContain('salon-a');
    expect(blocks.appInstallLinkHtml).toContain('<img');
  });
});
