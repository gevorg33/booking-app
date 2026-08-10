import { describe, expect, it } from '@jest/globals';
import { DASHBOARD_INTENTS } from './ai-command-registry.build.js';
import { DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS } from './ai-retail-finance.util.js';
import { BUSINESS_COMPLIANCE_MUTATE_INTENTS } from './ai-business-compliance.util.js';
import { DASHBOARD_API_AI_PARITY } from './dashboard-api-ai-parity.fixtures.js';
import {
  assertDashboardApiAiParity,
  formatDashboardParityEntryForDocs,
  listDashboardParityViolations,
  listMutatingDashboardIntentsMissingApiBinding,
  listUnknownDashboardIntents,
} from './dashboard-api-ai-parity.util.js';

describe('dashboard-api-ai-parity (ai-cmd-dashboard-6.19)', () => {
  it('has a parity entry for every REST row tracked in the ai-cmd-dashboard-6.1..6.18 audit', () => {
    expect(DASHBOARD_API_AI_PARITY.length).toBeGreaterThanOrEqual(70);
    assertDashboardApiAiParity(DASHBOARD_API_AI_PARITY);
  });

  it.each(DASHBOARD_API_AI_PARITY.map((entry) => [entry.id, entry] as const))(
    '%s registers dashboard intents, ai-bulk-internal, or is no-ai',
    (id, entry) => {
      expect(listDashboardParityViolations([entry])).toEqual([]);
      expect(formatDashboardParityEntryForDocs(entry).length).toBeGreaterThan(
        0,
      );
    },
  );

  it('flags unknown dashboard intents', () => {
    expect(listUnknownDashboardIntents(['update_business_profile'])).toEqual(
      [],
    );
    expect(
      listUnknownDashboardIntents(['not_a_real_dashboard_intent']),
    ).toEqual(['not_a_real_dashboard_intent']);
  });

  it('every dashboard-ai / ai-bulk-internal intent in parity exists in DASHBOARD_INTENTS registry', () => {
    const intents = new Set(
      DASHBOARD_API_AI_PARITY.flatMap((entry) =>
        entry.coverage.kind === 'dashboard-ai' ||
        entry.coverage.kind === 'ai-bulk-internal'
          ? entry.coverage.intents
          : [],
      ),
    );
    for (const intent of intents) {
      expect(DASHBOARD_INTENTS).toContain(intent);
    }
  });

  it('assertDashboardApiAiParity throws on invalid entries', () => {
    expect(() =>
      assertDashboardApiAiParity([
        {
          id: 'bad-intent',
          restPath: 'GET test',
          apiModule: 'test',
          coverage: {
            kind: 'dashboard-ai',
            intents: ['not_a_real_dashboard_intent'],
          },
        },
      ]),
    ).toThrow(/parity violations/);
  });

  it('listDashboardParityViolations catches duplicates and missing reasons', () => {
    const base = DASHBOARD_API_AI_PARITY[0];
    expect(
      listDashboardParityViolations([
        base,
        { ...base, restPath: 'somewhere else' },
        {
          id: 'empty-no-ai-reason',
          restPath: 'GET test',
          apiModule: 'test',
          coverage: { kind: 'no-ai', reason: '   ' },
        },
        {
          id: 'empty-no-ai-binary-reason',
          restPath: 'POST test',
          apiModule: 'test',
          coverage: { kind: 'no-ai-binary', reason: '' },
        },
        {
          id: 'empty-intents',
          restPath: 'GET test',
          apiModule: 'test',
          coverage: { kind: 'dashboard-ai', intents: [] },
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        `${base.id}: duplicate parity id`,
        'empty-no-ai-reason: missing reason for no-ai',
        'empty-no-ai-binary-reason: missing reason for no-ai-binary',
        'empty-intents: dashboard-ai coverage requires at least one intent',
      ]),
    );
  });

  it('cross-checks mutating retail-finance intents have an API binding row', () => {
    const missing = listMutatingDashboardIntentsMissingApiBinding(
      DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
      DASHBOARD_API_AI_PARITY,
    );
    expect(missing).toEqual(
      expect.not.arrayContaining([
        'create_product',
        'update_inventory_product',
        'delete_inventory_product',
        'set_recommended_products',
        'record_expense',
        'delete_expense',
        'create_commission_rule',
        'delete_commission_rule',
        'payout_export',
        'export_analytics_report',
      ]),
    );
  });

  it('cross-checks mutating business-compliance intents have an API binding row', () => {
    const missing = listMutatingDashboardIntentsMissingApiBinding(
      BUSINESS_COMPLIANCE_MUTATE_INTENTS,
      DASHBOARD_API_AI_PARITY,
    );
    expect(missing).toEqual(
      expect.not.arrayContaining([
        'report_data_breach',
        'send_breach_notification',
        'update_strategy_eval',
      ]),
    );
  });
});
