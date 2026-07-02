import {
  buildFocusedIntegrationHealthSummary,
  buildIntegrationHealthOverviewSummary,
  countConfiguredIntegrationAreas,
  integrationHealthNavigatePath,
  loadIntegrationHealthSnapshot,
  type IntegrationHealthSnapshot,
} from './ai-integration-health.snapshot.js';

const disabledSnapshot: IntegrationHealthSnapshot = {
  webhooks: {
    configured: false,
    count: 0,
    active: 0,
    summary: 'Webhooks: none configured.',
  },
  apiKeys: { configured: false, count: 0, summary: 'API keys: none created.' },
  zendesk: {
    configured: false,
    enabled: false,
    syncCustomersEnabled: false,
    summary: 'Zendesk: not connected.',
  },
  zapier: {
    configured: false,
    enabled: false,
    triggerCount: 0,
    summary: 'Zapier: disabled.',
  },
  accounting: {
    configured: false,
    enabled: false,
    summary: 'Accounting export: disabled.',
  },
  whatsapp: {
    configured: false,
    usingPlatformDefault: false,
    summary: 'WhatsApp: not connected — configure in Settings → WhatsApp.',
  },
  openAi: {
    configured: false,
    usingPlatformDefault: false,
    summary:
      'OpenAI: not configured — add a platform default or BYOK key in Settings → OpenAI.',
  },
  stripe: {
    configured: false,
    summary:
      'Stripe Connect: not connected — complete Billing onboarding before online prepayment.',
  },
};

describe('ai-integration-health.snapshot', () => {
  it('builds summaries for every focus and navigate paths', () => {
    expect(countConfiguredIntegrationAreas(disabledSnapshot)).toBe(0);
    expect(buildIntegrationHealthOverviewSummary(disabledSnapshot)).toContain(
      '0/8',
    );

    for (const focus of [
      'whatsapp',
      'openai',
      'stripe',
      'zendesk',
      'zapier',
      'webhooks',
      'apiKeys',
      'accounting',
    ] as const) {
      expect(
        buildFocusedIntegrationHealthSummary(disabledSnapshot, focus),
      ).toBeTruthy();
      expect(integrationHealthNavigatePath(focus).path).toBeTruthy();
    }

    expect(integrationHealthNavigatePath().path).toBe(
      '/dashboard/settings/integrations',
    );
  });

  it('loads live snapshot with connected whatsapp, openai, and stripe', async () => {
    const snapshot = await loadIntegrationHealthSnapshot(
      {
        webhooksService: { listSubscriptions: jest.fn(async () => []) } as any,
        apiKeyService: { listKeys: jest.fn(async () => []) } as any,
        zendeskIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: false,
            enabled: false,
            syncCustomersEnabled: false,
          })),
        } as any,
        zapierIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            enabled: false,
            webhookEvents: [],
          })),
        } as any,
        accountingIntegrationService: {
          getPublicSettings: jest.fn(async () => ({ enabled: false })),
        } as any,
        openAiIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: true,
            usingPlatformDefault: true,
          })),
        } as any,
        whatsappIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: true,
            usingPlatformDefault: true,
            phoneNumberId: '123',
          })),
        } as any,
        businessRepo: {
          findOne: jest.fn(async () => ({
            settings: {
              integrations: { stripe: { connectAccountId: 'acct_123' } },
            },
          })),
        } as any,
      },
      'biz-1',
    );

    expect(snapshot.whatsapp.summary).toContain('platform default');
    expect(snapshot.openAi.summary).toContain('platform default');
    expect(snapshot.stripe.summary).toContain('acct_123');
    expect(snapshot.zendesk.summary).toContain('not connected');
  });
});
