import {
  handleExplainTenantAppInstallLogic,
  handleRegenerateTenantAppInstallQrLogic,
} from './ai-tenant-app-install.logic.js';

describe('ai-tenant-app-install.logic', () => {
  const tenantAppInstallService = {
    ensureForBusiness: jest.fn(async (business: { slug: string }) => ({
      slug: business.slug,
      landingUrl: `https://app.test/get-app/${business.slug}?src=qr&utm_campaign=venue_qr`,
      qrDataUrl: 'data:image/png;base64,abc',
      customSchemeUrl: `optischedule://book/${business.slug}`,
      generatedAt: '2026-06-01T00:00:00.000Z',
    })),
    regenerateForBusiness: jest.fn(async (business: { slug: string }) => ({
      slug: business.slug,
      landingUrl: `https://app.test/get-app/${business.slug}?src=qr&utm_campaign=venue_qr`,
      qrDataUrl: 'data:image/png;base64,regenerated',
      customSchemeUrl: `optischedule://book/${business.slug}`,
      generatedAt: '2026-06-02T00:00:00.000Z',
    })),
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'salon-demo',
      settings: {},
    })),
  };

  it('explains tenant app install landing and QR', async () => {
    const result = await handleExplainTenantAppInstallLogic(
      { tenantAppInstallService, businessRepo } as any,
      'biz-1',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tenant_app_install');
    expect(result.summary).toContain('/get-app/salon-demo');
    expect(result.details?.guidance).toMatchObject({
      navigate: {
        path: '/dashboard/integrations',
        label: 'Open Integrations → Growth',
      },
    });
  });

  it('returns failure when business is missing', async () => {
    const result = await handleExplainTenantAppInstallLogic(
      {
        tenantAppInstallService,
        businessRepo: { findOne: jest.fn(async () => null) },
      } as any,
      'missing',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_tenant_app_install');
  });

  it('returns failure when ensureForBusiness throws', async () => {
    const result = await handleExplainTenantAppInstallLogic(
      {
        tenantAppInstallService: {
          ensureForBusiness: jest.fn(async () => {
            throw new Error('QR generation failed');
          }),
        },
        businessRepo,
      } as any,
      'biz-1',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toBe('QR generation failed');
  });

  it('regenerates tenant app install QR assets', async () => {
    const result = await handleRegenerateTenantAppInstallQrLogic(
      { tenantAppInstallService, businessRepo } as any,
      'biz-1',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('regenerate_tenant_app_install_qr');
    expect(result.summary).toContain('Regenerated tenant app install QR');
    expect(result.details?.regenerated).toBe(true);
    expect(tenantAppInstallService.regenerateForBusiness).toHaveBeenCalled();
  });

  it('returns failure when regenerateForBusiness throws', async () => {
    const result = await handleRegenerateTenantAppInstallQrLogic(
      {
        tenantAppInstallService: {
          regenerateForBusiness: jest.fn(async () => {
            throw new Error('regenerate failed');
          }),
        },
        businessRepo,
      } as any,
      'biz-1',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('regenerate_tenant_app_install_qr');
  });

  it('returns failure when business is missing for regenerate', async () => {
    const result = await handleRegenerateTenantAppInstallQrLogic(
      {
        tenantAppInstallService,
        businessRepo: { findOne: jest.fn(async () => null) },
      } as any,
      'missing',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('regenerate_tenant_app_install_qr');
  });
});
