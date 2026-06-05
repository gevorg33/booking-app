import {
  buildGdprMetadata,
  getCustomerGdpr,
} from './customer-privacy.types.js';

describe('Sprint 37 — customer privacy types compliance', () => {
  it.each([
    {
      id: 'privacy-only',
      input: { privacyAccepted: true, privacyVersion: '2.0' },
      expectTypes: ['privacy'],
      fields: { privacyVersion: '2.0' },
    },
    {
      id: 'marketing-opt-out',
      input: { marketingOptIn: false, source: 'account' as const },
      expectTypes: ['marketing'],
      fields: { marketingOptIn: false, source: 'account' },
    },
    {
      id: 'granular-ai',
      input: { aiProcessingOptIn: true, ip: '10.0.0.1' },
      expectTypes: ['ai_processing'],
      fields: { aiProcessingOptIn: true },
    },
    {
      id: 'granular-third-party',
      input: { thirdPartyIntegrationsOptIn: false },
      expectTypes: ['third_party_integrations'],
      fields: { thirdPartyIntegrationsOptIn: false },
    },
    {
      id: 'cookies',
      input: { cookiesAccepted: true },
      expectTypes: ['cookies'],
      fields: {},
    },
    {
      id: 'full-checkout-consent',
      input: {
        privacyAccepted: true,
        privacyVersion: '3.0',
        marketingOptIn: true,
        aiProcessingOptIn: true,
        thirdPartyIntegrationsOptIn: true,
        cookiesAccepted: true,
        source: 'checkout' as const,
        ip: '192.168.1.1',
      },
      expectTypes: [
        'privacy',
        'marketing',
        'ai_processing',
        'third_party_integrations',
        'cookies',
      ],
      fields: {
        privacyVersion: '3.0',
        marketingOptIn: true,
        aiProcessingOptIn: true,
        thirdPartyIntegrationsOptIn: true,
      },
    },
  ])('buildGdprMetadata scenario $id', ({ input, expectTypes, fields }) => {
    const metadata = buildGdprMetadata({ gdpr: { source: 'admin' } }, input);
    const gdpr = metadata.gdpr as {
      consentLog?: Array<{ type: string; ip?: string }>;
    };

    expect(metadata.gdpr).toMatchObject(fields);
    expect(gdpr.consentLog?.map((e) => e.type)).toEqual(
      expect.arrayContaining(expectTypes),
    );
    if (input.ip) {
      expect(gdpr.consentLog?.some((e) => e.ip === input.ip)).toBe(true);
    }
  });

  it('caps consent log at 50 entries', () => {
    let metadata: Record<string, unknown> = {};
    for (let i = 0; i < 55; i += 1) {
      metadata = buildGdprMetadata(metadata, { marketingOptIn: i % 2 === 0 });
    }
    const log = (metadata.gdpr as { consentLog?: unknown[] }).consentLog ?? [];
    expect(log).toHaveLength(50);
  });

  it('getCustomerGdpr reads stored consent including deletion flags', () => {
    expect(
      getCustomerGdpr({
        gdpr: { deletionRequested: true, deletedAt: '2026-01-01' },
      }),
    ).toMatchObject({
      deletionRequested: true,
      deletedAt: '2026-01-01',
    });
  });
});
