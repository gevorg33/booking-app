import { describe, expect, it } from '@jest/globals';
import {
  CUSTOMER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { SELF_SERVICE_BOOKING_MUTATE_INTENTS } from './ai-self-service-booking.util.js';
import { CUSTOMER_PUBLIC_API_AI_PARITY } from './customer-public-api-ai-parity.fixtures.js';
import {
  assertCustomerPublicApiAiParity,
  formatParityEntryForDocs,
  listMutateIntentsMissingApiBinding,
  listParityViolations,
  listUnknownCustomerIntents,
  listUnknownPublicIntents,
} from './customer-public-api-ai-parity.util.js';

describe('customer-public-api-ai-parity (ai-cmd-customer-6.13)', () => {
  it('has a parity entry for every tracked public-api.ts export', () => {
    expect(CUSTOMER_PUBLIC_API_AI_PARITY.length).toBeGreaterThanOrEqual(70);
    assertCustomerPublicApiAiParity(CUSTOMER_PUBLIC_API_AI_PARITY);
  });

  it.each(
    CUSTOMER_PUBLIC_API_AI_PARITY.map((entry) => [entry.id, entry] as const),
  )(
    '%s registers customer/public intents or is dashboard-only/no-ai',
    (id, entry) => {
      expect(listParityViolations([entry])).toEqual([]);
      expect(formatParityEntryForDocs(entry).length).toBeGreaterThan(0);
    },
  );

  it('flags unknown customer intents', () => {
    expect(listUnknownCustomerIntents(['my_profile'])).toEqual([]);
    expect(listUnknownCustomerIntents(['not_a_real_customer_intent'])).toEqual([
      'not_a_real_customer_intent',
    ]);
  });

  it('flags unknown public intents', () => {
    expect(listUnknownPublicIntents(['list_services'])).toEqual([]);
    expect(listUnknownPublicIntents(['not_a_real_public_intent'])).toEqual([
      'not_a_real_public_intent',
    ]);
  });

  it('every customer-ai intent in parity exists in CUSTOMER_INTENTS registry', () => {
    const intents = new Set(
      CUSTOMER_PUBLIC_API_AI_PARITY.flatMap((entry) =>
        entry.coverage.kind === 'customer-ai' ? entry.coverage.intents : [],
      ),
    );
    for (const intent of intents) {
      expect(CUSTOMER_INTENTS).toContain(intent);
    }
  });

  it('every public-ai intent in parity exists in PUBLIC_INTENTS registry', () => {
    const intents = new Set(
      CUSTOMER_PUBLIC_API_AI_PARITY.flatMap((entry) =>
        entry.coverage.kind === 'public-ai' ? entry.coverage.intents : [],
      ),
    );
    for (const intent of intents) {
      expect(PUBLIC_INTENTS).toContain(intent);
    }
  });

  it('assertCustomerPublicApiAiParity throws on invalid entries', () => {
    expect(() =>
      assertCustomerPublicApiAiParity([
        {
          id: 'bad-intent',
          exportName: 'badExport',
          apiModule: 'test',
          coverage: {
            kind: 'customer-ai',
            intents: ['not_a_real_customer_intent'],
          },
        },
      ]),
    ).toThrow(/parity violations/);
  });

  it('listParityViolations catches duplicates and missing reasons', () => {
    const base = CUSTOMER_PUBLIC_API_AI_PARITY[0];
    expect(
      listParityViolations([
        base,
        { ...base, exportName: 'somethingElse' },
        {
          id: 'empty-no-ai-reason',
          exportName: 'emptyReasonExport',
          apiModule: 'test',
          coverage: { kind: 'no-ai', reason: '   ' },
        },
        {
          id: 'empty-intents',
          exportName: 'emptyIntentsExport',
          apiModule: 'test',
          coverage: { kind: 'public-ai', intents: [] },
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        `${base.id}: duplicate parity id`,
        'empty-no-ai-reason: missing reason for no-ai',
        'empty-intents: public-ai coverage requires at least one intent',
      ]),
    );
  });

  it('cross-checks mutating self-service-booking intents have an API binding row', () => {
    const missing = listMutateIntentsMissingApiBinding(
      SELF_SERVICE_BOOKING_MUTATE_INTENTS,
      CUSTOMER_PUBLIC_API_AI_PARITY,
    );
    expect(missing).toEqual(
      expect.not.arrayContaining([
        'cancel_my_booking',
        'reschedule_my_booking',
        'cancel_package_visit_self',
        'reschedule_package_visit_self',
        'reschedule_package_lines',
      ]),
    );
  });
});
