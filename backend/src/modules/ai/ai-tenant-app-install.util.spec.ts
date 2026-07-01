import {
  EXPLAIN_TENANT_APP_INSTALL_INTENT,
  EXPLAIN_TENANT_APP_INSTALL_PROMPTS,
  REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
  REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS,
  buildExplainTenantAppInstallGuidance,
  buildRegenerateTenantAppInstallSummary,
  isExplainTenantAppInstallPrompt,
  isRegenerateTenantAppInstallQrPrompt,
  rescueExplainTenantAppInstallIntent,
  rescueRegenerateTenantAppInstallQrIntent,
} from './ai-tenant-app-install.util.js';

describe('ai-tenant-app-install.util', () => {
  it.each(EXPLAIN_TENANT_APP_INSTALL_PROMPTS)(
    'detects explain tenant app install for $id',
    ({ prompt }) => {
      expect(isExplainTenantAppInstallPrompt(prompt)).toBe(true);
    },
  );

  it('does not classify customer self-download prompts', () => {
    expect(
      isExplainTenantAppInstallPrompt('How do I download the app on my phone'),
    ).toBe(false);
    expect(isExplainTenantAppInstallPrompt('Get the app on my iPhone')).toBe(
      false,
    );
    expect(
      isExplainTenantAppInstallPrompt('How do I get the tenant app install QR'),
    ).toBe(false);
    expect(
      isExplainTenantAppInstallPrompt(
        'What is the app install link on my phone',
      ),
    ).toBe(false);
  });

  it('does not classify regenerate QR as explain', () => {
    expect(
      isExplainTenantAppInstallPrompt('Regenerate tenant app install QR'),
    ).toBe(false);
  });

  it.each(REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS)(
    'detects regenerate tenant app install for $id',
    ({ prompt }) => {
      expect(isRegenerateTenantAppInstallQrPrompt(prompt)).toBe(true);
      expect(isExplainTenantAppInstallPrompt(prompt)).toBe(false);
    },
  );

  it.each(REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS)(
    'rescues unknown action to regenerate_tenant_app_install_qr for $id',
    ({ prompt }) => {
      expect(
        rescueRegenerateTenantAppInstallQrIntent(prompt, 'unknown'),
      ).toEqual({
        action: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
        rescueReason: 'tenant_app_install_regenerate',
      });
    },
  );

  it('prefers regenerate rescue over explain for refresh prompts', () => {
    expect(
      rescueExplainTenantAppInstallIntent(
        'Regenerate tenant app install QR',
        'unknown',
      ),
    ).toBeNull();
  });

  it.each(EXPLAIN_TENANT_APP_INSTALL_PROMPTS)(
    'rescues unknown action to explain_tenant_app_install for $id',
    ({ prompt }) => {
      expect(rescueExplainTenantAppInstallIntent(prompt, 'unknown')).toEqual({
        action: EXPLAIN_TENANT_APP_INSTALL_INTENT,
        rescueReason: 'tenant_app_install_explain',
      });
    },
  );

  it('returns null when action already matches', () => {
    expect(
      rescueExplainTenantAppInstallIntent(
        'Explain our tenant app install QR',
        EXPLAIN_TENANT_APP_INSTALL_INTENT,
      ),
    ).toBeNull();
  });

  it('matches explain verb without dashboard owner scope when not customer-self', () => {
    expect(isExplainTenantAppInstallPrompt('Explain get-app page setup')).toBe(
      true,
    );
    expect(isExplainTenantAppInstallPrompt('')).toBe(false);
    expect(isExplainTenantAppInstallPrompt('Book a haircut tomorrow')).toBe(
      false,
    );
  });

  it('matches integrations growth tab phrasing', () => {
    expect(
      isExplainTenantAppInstallPrompt(
        'Show app install QR on integrations growth tab',
      ),
    ).toBe(true);
  });

  it('builds guidance from tenant app install view', () => {
    const guidance = buildExplainTenantAppInstallGuidance({
      view: {
        slug: 'salon-demo',
        landingUrl:
          'https://app.test/get-app/salon-demo?src=qr&utm_campaign=venue_qr',
        qrDataUrl: 'data:image/png;base64,abc',
        customSchemeUrl: 'optischedule://book/salon-demo',
        generatedAt: '2026-06-01T00:00:00.000Z',
      },
    });
    expect(guidance.landingUrl).toContain('/get-app/salon-demo');
    expect(guidance.navigate.path).toBe('/dashboard/integrations');
    expect(guidance.steps.length).toBe(4);
    expect(guidance.summary).toContain('Integrations → Growth');
  });

  it('builds regenerate summary from tenant app install view', () => {
    const result = buildRegenerateTenantAppInstallSummary({
      view: {
        slug: 'salon-demo',
        landingUrl:
          'https://app.test/get-app/salon-demo?src=qr&utm_campaign=venue_qr',
        qrDataUrl: 'data:image/png;base64,abc',
        customSchemeUrl: 'optischedule://book/salon-demo',
        generatedAt: '2026-06-01T00:00:00.000Z',
      },
    });
    expect(result.summary).toContain('Regenerated tenant app install QR');
    expect(result.landingUrl).toContain('/get-app/salon-demo');
  });
});
