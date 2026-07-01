import {
  CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES,
  TRACK_LAB_ORDER_STATUS_PROMPTS,
  TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS,
} from './ai-track-lab-order-status.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS } from './ai-track-lab-order-status-multilingual.fixtures.js';
import { LIST_MY_TEST_RESULTS_PROMPTS } from './ai-consumer-clinic-test-results.fixtures.js';
import {
  isListMyTestResultsPrompt,
  isExplainResultStatusPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import {
  enrichTrackLabOrderStatusParamsFromPrompt,
  formatLabOrderTrackingSummary,
  isTrackLabOrderStatusIntent,
  isTrackLabOrderStatusPrompt,
  parseTrackLabOrderStatusFromPrompt,
  rescueTrackLabOrderStatusIntent,
} from './ai-track-lab-order-status.util.js';
import { AI_COMMAND_EVAL_TRACK_LAB_ORDER_STATUS_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-track-lab-order-status.util', () => {
  it('exports classifier rules for track_lab_order_status', () => {
    expect(CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES).toContain(
      'track_lab_order_status',
    );
  });

  it.each(TRACK_LAB_ORDER_STATUS_PROMPTS)(
    'detects track_lab_order_status for $id',
    ({ prompt, testName }) => {
      expect(isTrackLabOrderStatusPrompt(prompt)).toBe(true);
      const parsed = parseTrackLabOrderStatusFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (testName) {
        expect(parsed?.testName?.toLowerCase()).toContain(
          testName.toLowerCase(),
        );
      }
    },
  );

  it.each(TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual track_lab_order_status for $id',
    ({ prompt }) => {
      expect(isTrackLabOrderStatusPrompt(prompt)).toBe(true);
    },
  );

  it.each(TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueTrackLabOrderStatusIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(LIST_MY_TEST_RESULTS_PROMPTS)(
    'does not treat list prompt $id as track',
    ({ prompt }) => {
      expect(isTrackLabOrderStatusPrompt(prompt)).toBe(false);
    },
  );

  it('does not treat explain FAQ as track', () => {
    expect(
      isTrackLabOrderStatusPrompt(
        'What does released mean for my lab results?',
      ),
    ).toBe(false);
    expect(
      isExplainResultStatusPrompt(
        'What does released mean for my lab results?',
      ),
    ).toBe(true);
  });

  it('does not treat public booking page list prompts as track', () => {
    expect(
      isTrackLabOrderStatusPrompt(
        'Are lab results from my visit available here?',
      ),
    ).toBe(false);
    expect(
      isListMyTestResultsPrompt(
        'Are lab results from my visit available here?',
      ),
    ).toBe(true);
  });

  it('formats ready and in-progress tracking summary', () => {
    const summary = formatLabOrderTrackingSummary([
      {
        id: 'r1',
        testName: 'CBC',
        status: 'Released',
        releasedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-05-30T12:00:00.000Z',
      },
      {
        id: 'r2',
        testName: 'Lipid panel',
        status: 'Pending',
        releasedAt: null,
        createdAt: '2026-05-29T12:00:00.000Z',
      },
    ]);
    expect(summary).toContain('1 result ready');
    expect(summary).toContain('CBC');
    expect(summary).toContain('still in progress');
    expect(summary).not.toContain('None are ready in My Results yet.');
  });

  it('notes when nothing is ready yet', () => {
    const summary = formatLabOrderTrackingSummary([
      {
        id: 'r2',
        testName: 'Lipid panel',
        status: 'Pending',
        releasedAt: null,
        createdAt: '2026-05-29T12:00:00.000Z',
      },
    ]);
    expect(summary).toContain('None are ready in My Results yet.');
  });

  it('returns empty-account message when no results exist', () => {
    expect(formatLabOrderTrackingSummary([])).toContain(
      'no lab orders or results',
    );
  });

  it('returns named-test empty message when filter misses', () => {
    expect(
      formatLabOrderTrackingSummary(
        [
          {
            id: 'r1',
            testName: 'CBC',
            status: 'Released',
            releasedAt: '2026-06-01T12:00:00.000Z',
            createdAt: '2026-05-30T12:00:00.000Z',
          },
        ],
        'lipid panel',
      ),
    ).toContain('No lab results found for lipid panel');
  });

  it('does not treat empty prompts as track', () => {
    expect(isTrackLabOrderStatusPrompt('')).toBe(false);
    expect(isTrackLabOrderStatusPrompt('   ')).toBe(false);
  });

  it('blocks list-only phrasing without readiness cue', () => {
    expect(isTrackLabOrderStatusPrompt('Show my lab test results')).toBe(false);
  });

  it('detects heuristic readiness prompts', () => {
    expect(
      isTrackLabOrderStatusPrompt('Has my blood work come back yet?'),
    ).toBe(true);
  });

  it('parses testName from params', () => {
    expect(
      parseTrackLabOrderStatusFromPrompt('Are my results ready?', {
        testName: 'CBC',
      })?.testName,
    ).toBe('CBC');
    expect(
      enrichTrackLabOrderStatusParamsFromPrompt(
        { testName: 'CBC' },
        'Are my results ready?',
      ).testName,
    ).toBe('CBC');
  });

  it('truncates long ready and in-progress lists', () => {
    const summary = formatLabOrderTrackingSummary([
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `ready-${index}`,
        testName: `Ready test ${index + 1}`,
        status: 'Released',
        releasedAt: null,
        createdAt: '2026-05-29T12:00:00.000Z',
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `pending-${index}`,
        testName: `Pending test ${index + 1}`,
        status: 'Pending',
        releasedAt: null,
        createdAt: '2026-05-29T12:00:00.000Z',
      })),
    ]);
    expect(summary).toContain('more ready');
    expect(summary).toContain('more in progress');
    expect(summary).toContain('recently');
  });

  it('formats unknown statuses literally', () => {
    const summary = formatLabOrderTrackingSummary([
      {
        id: 'r1',
        testName: 'Custom panel',
        status: 'CustomStatus',
        releasedAt: null,
        createdAt: '2026-05-29T12:00:00.000Z',
      },
    ]);
    expect(summary).toContain('CustomStatus');
  });

  it('enriches params and recognizes intent helpers', () => {
    expect(isTrackLabOrderStatusIntent('track_lab_order_status')).toBe(true);
    expect(isTrackLabOrderStatusIntent('list_my_test_results')).toBe(false);
    expect(
      enrichTrackLabOrderStatusParamsFromPrompt(
        {},
        'Is my lipid panel ready yet?',
      ).testName,
    ).toBe('lipid panel');
    expect(
      rescueTrackLabOrderStatusIntent(
        'Are my results ready?',
        'track_lab_order_status',
      ),
    ).toBeNull();
  });

  it('has eval golden cases for every fixture scenario', () => {
    expect(TRACK_LAB_ORDER_STATUS_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_TRACK_LAB_ORDER_STATUS_CASES.length).toBe(
      TRACK_LAB_ORDER_STATUS_PROMPTS.length +
        TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS.length +
        TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_TRACK_LAB_ORDER_STATUS_CASES) {
      expect(evalCase.expect.rescuedAction).toBe('track_lab_order_status');
    }
  });
});
