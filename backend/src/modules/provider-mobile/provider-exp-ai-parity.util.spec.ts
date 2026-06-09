import { describe, expect, it } from '@jest/globals';
import { PROVIDER_INTENTS } from '../ai/ai-command-registry.build.js';
import {
  PROVIDER_EXP_DEFERRED_TASK_IDS,
  PROVIDER_EXP_UI_AI_PARITY,
} from './provider-exp-ai-parity.fixtures.js';
import {
  assertProviderExpAiParity,
  formatParityEntryForDocs,
  listParityViolations,
  listUnknownProviderIntents,
} from './provider-exp-ai-parity.util.js';

describe('provider-exp-ai-parity (prov-exp-11)', () => {
  it('has a parity entry for every shipped prov-exp UI action', () => {
    expect(PROVIDER_EXP_UI_AI_PARITY.length).toBeGreaterThanOrEqual(30);
    assertProviderExpAiParity(PROVIDER_EXP_UI_AI_PARITY);
  });

  it('does not include deferred waitlist tasks in parity gate', () => {
    const taskIds = new Set(PROVIDER_EXP_UI_AI_PARITY.map((e) => e.taskId));
    for (const deferred of PROVIDER_EXP_DEFERRED_TASK_IDS) {
      expect(taskIds.has(deferred)).toBe(false);
    }
  });

  it.each(PROVIDER_EXP_UI_AI_PARITY.map((entry) => [entry.id, entry] as const))(
    '%s registers provider intents or is dashboard-only',
    (id, entry) => {
      expect(listParityViolations([entry])).toEqual([]);
      expect(formatParityEntryForDocs(entry).length).toBeGreaterThan(0);
    },
  );

  it('covers all prov-exp-1..10 task ids except deferred slices', () => {
    const coveredTasks = new Set(
      PROVIDER_EXP_UI_AI_PARITY.map((entry) => entry.taskId),
    );
    const expectedTasks = [
      'prov-exp-1.1',
      'prov-exp-1.2',
      'prov-exp-1.3',
      'prov-exp-1.4',
      'prov-exp-1.5',
      'prov-exp-2.1',
      'prov-exp-2.2',
      'prov-exp-2.3',
      'prov-exp-3.1',
      'prov-exp-3.2',
      'prov-exp-3.3',
      'prov-exp-4.1',
      'prov-exp-4.2',
      'prov-exp-4.3',
      'prov-exp-5.1',
      'prov-exp-5.2',
      'prov-exp-6.1',
      'prov-exp-6.2',
      'prov-exp-7.1',
      'prov-exp-7.2',
      'prov-exp-7.3',
      'prov-exp-9.1',
      'prov-exp-9.2',
      'prov-exp-10.1',
      'prov-exp-10.2',
      'prov-exp-10.3',
      'prov-exp-10.4',
    ];
    for (const taskId of expectedTasks) {
      expect(coveredTasks.has(taskId)).toBe(true);
    }
  });

  it('flags unknown provider intents', () => {
    expect(listUnknownProviderIntents(['summarize_client'])).toEqual([]);
    expect(listUnknownProviderIntents(['not_a_real_provider_intent'])).toEqual([
      'not_a_real_provider_intent',
    ]);
  });

  it('every provider-ai intent in parity exists in PROVIDER_INTENTS registry', () => {
    const parityIntents = new Set(
      PROVIDER_EXP_UI_AI_PARITY.flatMap((entry) =>
        entry.coverage.kind === 'provider-ai' ? entry.coverage.intents : [],
      ),
    );
    for (const intent of parityIntents) {
      expect(PROVIDER_INTENTS).toContain(intent);
    }
  });

  it('assertProviderExpAiParity throws on invalid entries', () => {
    expect(() =>
      assertProviderExpAiParity([
        {
          id: 'bad-intent',
          taskId: 'prov-exp-test',
          screen: 'Test',
          uiAction: 'Bad',
          coverage: { kind: 'provider-ai', intents: ['not_a_real_provider_intent'] },
        },
      ]),
    ).toThrow(/parity violations/);
  });

  it('listParityViolations catches duplicate ids and empty dashboard reason', () => {
    const base = PROVIDER_EXP_UI_AI_PARITY[0];
    expect(
      listParityViolations([
        base,
        { ...base, uiAction: 'duplicate' },
        {
          id: 'empty-dashboard-reason',
          taskId: 'prov-exp-test',
          screen: 'Test',
          uiAction: 'Empty reason',
          coverage: { kind: 'dashboard-only', dashboardReason: '   ' },
        },
        {
          id: 'empty-intents',
          taskId: 'prov-exp-test',
          screen: 'Test',
          uiAction: 'No intents',
          coverage: { kind: 'provider-ai', intents: [] },
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        `${base.id}: duplicate parity id`,
        'empty-dashboard-reason: missing dashboardReason',
        'empty-intents: provider-ai coverage requires at least one intent',
      ]),
    );
  });
});
