import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  N99_NO_CLARIFY_OVER_ASK_SCENARIOS,
  N99_OVER_ASK_VALIDATOR_SCENARIOS,
} from './ai-n99-over-ask.fixtures.js';
import {
  applyOverAskSafeDefaults,
  hasOverAskSafeDate,
  resolveRelativeDateFromPrompt,
  resolveTodayDateKey,
  trimOverAskClarifyIssues,
} from './ai-n99-over-ask.util.js';

function baseCmd(overrides: Partial<ResolvedCommand>): ResolvedCommand {
  return {
    action: 'list_bookings',
    params: {},
    enrichedParams: {},
    entities: { employees: [] },
    reasoning: 'test',
    prompt: '',
    businessId: 'biz-1',
    ...overrides,
  };
}

describe('ai-n99-over-ask.util (n99-2.6)', () => {
  it('resolveRelativeDateFromPrompt maps today and tomorrow', () => {
    const now = new Date('2026-06-08T12:00:00.000Z');
    expect(resolveRelativeDateFromPrompt("show today's appointments", now)).toBe(
      '2026-06-08',
    );
    expect(resolveRelativeDateFromPrompt('list bookings tomorrow', now)).toBe(
      '2026-06-09',
    );
  });

  it('applyOverAskSafeDefaults fills date from screen context', () => {
    const normalized = applyOverAskSafeDefaults(
      baseCmd({ action: 'list_bookings', params: {} }),
      { screenContext: { date: '2026-06-09' } },
    );
    expect(normalized.params.date).toBe('2026-06-09');
    expect(hasOverAskSafeDate(normalized)).toBe(true);
  });

  it('applyOverAskSafeDefaults fills summarize_day with today when unqualified', () => {
    const normalized = applyOverAskSafeDefaults(
      baseCmd({ action: 'summarize_day', prompt: 'summarize the day' }),
      { prompt: 'summarize the day' },
    );
    expect(normalized.params.date).toBe(resolveTodayDateKey());
  });

  it('applyOverAskSafeDefaults fills bookingId for on-screen cancel', () => {
    const normalized = applyOverAskSafeDefaults(
      baseCmd({ action: 'cancel_bookings', prompt: 'cancel this booking' }),
      {
        prompt: 'cancel this booking',
        screenContext: { bookingId: 'bk-1' },
      },
    );
    expect(normalized.params.bookingId).toBe('bk-1');
  });

  it.each(N99_NO_CLARIFY_OVER_ASK_SCENARIOS)(
    '$id trims over-ask clarify issues',
    (scenario) => {
      const trimmed = trimOverAskClarifyIssues({
        action: scenario.action,
        params: scenario.params,
        prompt: scenario.prompt,
        screenContext: scenario.screenContext,
        sessionContext: scenario.sessionContext,
        issues: scenario.issues.map((issue) => ({
          field: issue.field,
          label: issue.field,
          message: issue.message,
        })),
      });
      for (const field of scenario.expectTrimmedFields) {
        expect(trimmed.some((issue) => issue.field === field)).toBe(false);
      }
    },
  );

  it.each(N99_OVER_ASK_VALIDATOR_SCENARIOS)(
    '$id passes validateCommand after safe defaults',
    (scenario) => {
      const result = validateCommand(
        baseCmd({
          action: scenario.action,
          prompt: scenario.prompt,
          params: scenario.params,
        }),
      );
      expect(result.ok).toBe(scenario.expectOk);
    },
  );
});
