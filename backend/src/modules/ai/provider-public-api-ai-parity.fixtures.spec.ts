import { PROVIDER_PUBLIC_API_AI_PARITY } from './provider-public-api-ai-parity.fixtures.js';

describe('provider-public-api-ai-parity.fixtures (ai-cmd-provider-6.4.1 / 6.13)', () => {
  it('documents the four ai-bulk-internal booking intents with no REST bulk_* route', () => {
    const internalEntries = PROVIDER_PUBLIC_API_AI_PARITY.filter(
      (entry) => entry.coverage.kind === 'ai-bulk-internal',
    );
    const intents = internalEntries.flatMap((entry) => entry.coverage.intents);
    expect(intents.sort()).toEqual(
      [
        'cancel_bookings',
        'mark_no_shows',
        'payment_sweep',
        'update_bookings',
      ].sort(),
    );
    for (const entry of internalEntries) {
      expect(entry.coverage.restEquivalent).not.toMatch(/bulk_/);
      expect(entry.apiModule).toBe('provider-mobile');
    }
  });

  it('documents the ai-bulk-native intents backed by a real bulk REST endpoint (6.13.1/6.13.2)', () => {
    const nativeEntries = PROVIDER_PUBLIC_API_AI_PARITY.filter(
      (entry) => entry.coverage.kind === 'ai-bulk-native',
    );
    const intents = nativeEntries.flatMap((entry) => entry.coverage.intents);
    expect(intents.sort()).toEqual(
      ['mark_all_notifications_read', 'set_retail_sales_lines'].sort(),
    );
  });

  it('has unique entry ids', () => {
    const ids = PROVIDER_PUBLIC_API_AI_PARITY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
