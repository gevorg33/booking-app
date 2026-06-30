import {
  buildFocusedIntegrationHealthSummary,
  buildIntegrationHealthOverviewSummary,
  countConfiguredIntegrationAreas,
  type IntegrationHealthSnapshot,
} from './ai-integration-health.snapshot.js';
import { handleExplainIntegrationHealthLogic } from './ai-explain-integration-health.logic.js';

const snapshot: IntegrationHealthSnapshot = {
  webhooks: {
    configured: true,
    count: 1,
    active: 1,
    summary: 'Webhooks: 1 subscription(s), 1 active.',
  },
  apiKeys: {
    configured: true,
    count: 1,
    summary: 'API keys: 1 active key(s).',
  },
  zendesk: {
    configured: true,
    enabled: true,
    syncCustomersEnabled: true,
    summary: 'Zendesk: connected and enabled; customer sync on.',
  },
  zapier: {
    configured: true,
    enabled: true,
    triggerCount: 2,
    summary: 'Zapier: enabled with 2 trigger event(s).',
  },
  accounting: {
    configured: true,
    enabled: true,
    provider: 'csv',
    summary: 'Accounting export: enabled (csv).',
  },
  whatsapp: {
    configured: true,
    usingPlatformDefault: false,
    phoneNumberId: '123',
    summary: 'WhatsApp: connected with salon credentials (phone number ID 123).',
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
  it('counts configured integration areas', () => {
    expect(countConfiguredIntegrationAreas(snapshot)).toBe(6);
  });

  it('builds focused and overview summaries', () => {
    expect(buildFocusedIntegrationHealthSummary(snapshot, 'whatsapp')).toContain(
      'WhatsApp: connected',
    );
    expect(buildIntegrationHealthOverviewSummary(snapshot)).toContain('6/8');
  });
});

describe('ai-explain-integration-health.logic', () => {
  const deps = {
    webhooksService: {
      listSubscriptions: jest.fn(async () => [
        { id: 'wh-1', isActive: true },
      ]),
    },
    apiKeyService: { listKeys: jest.fn(async () => [{ id: 'k1' }]) },
    zendeskIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: true,
        enabled: true,
        syncCustomersEnabled: true,
      })),
    },
    zapierIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        enabled: true,
        webhookEvents: ['booking.created'],
      })),
    },
    accountingIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        enabled: true,
        provider: 'csv',
      })),
    },
    openAiIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: true,
        usingPlatformDefault: true,
      })),
    },
    whatsappIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: true,
        usingPlatformDefault: true,
        phoneNumberId: '123',
      })),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
    },
    integrationsDocsService: { buildDocs: jest.fn(() => ({})) },
  };

  it('answers focused whatsapp health prompt', async () => {
    const result = await handleExplainIntegrationHealthLogic(
      deps as any,
      'biz-1',
      {},
      'Is WhatsApp connected?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_integration_health');
    expect(result.summary).toContain('WhatsApp:');
    expect(result.details?.integrationFocus).toBe('whatsapp');
  });

  it('answers overview integration health prompt', async () => {
    const result = await handleExplainIntegrationHealthLogic(
      deps as any,
      'biz-1',
      {},
      'Which integrations are connected?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('/8');
    expect(result.details?.integrationFocus).toBeUndefined();
  });

  it('fails for unrelated prompt', async () => {
    const result = await handleExplainIntegrationHealthLogic(
      deps as any,
      'biz-1',
      {},
      'Configure WhatsApp integration',
    );
    expect(result.success).toBe(false);
  });
});
