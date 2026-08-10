/**
 * AI-ROADMAP Phase 6 — clarify as a first-class outcome.
 *
 * Two things are under test: the structured request itself, and the fix that
 * stops it being swallowed. The second matters more — before this, a command
 * that knew exactly what to ask appended a product-guide tour instead of
 * asking it (AI-TODO Phase 6).
 */
import {
  clarifyFromDateResolution,
  clarifyFromEntityResolution,
  clarifyFromPlanProblems,
  clarifyFromTimeResolution,
  isClarifyResult,
  MAX_CLARIFY_OPTIONS,
} from './ai-clarify.util.js';
import { resolveEntity } from './ai-entity-resolution.util.js';
import {
  resolveRelativeDate,
  resolveTimeOfDay,
} from './ai-datetime-resolution.util.js';
import {
  looksLikeVerbPhrase,
  shouldAppendPostFailureGuideFallback,
} from './ai-product-guide-failure-fallback.util.js';
import type { PlanProblem } from './ai-command-plan.types.js';

describe('clarifyFromEntityResolution', () => {
  it('returns nothing when resolution succeeded', () => {
    const resolved = resolveEntity(
      [{ id: 'e1', name: 'John Smith' }],
      'John Smith',
    );
    expect(clarifyFromEntityResolution(resolved)).toBeNull();
  });

  it('turns an ambiguous match into a question with the candidates', () => {
    // §29's case: two customers named John. The old resolver picked one
    // silently; this asks, and gives the client something to render.
    const ambiguous = resolveEntity(
      [
        { id: 'c1', name: 'John Smith' },
        { id: 'c2', name: 'John Baker' },
      ],
      'John',
    );
    const clarify = clarifyFromEntityResolution(ambiguous, {
      command: 'appointment.create',
      variable: 'customerName',
      entityLabel: 'customer',
    })!;

    expect(clarify.reason).toBe('ambiguous_entity');
    expect(clarify.question).toContain('Which');
    expect(clarify.options).toEqual([
      { value: 'c1', label: 'John Smith' },
      { value: 'c2', label: 'John Baker' },
    ]);
    expect(clarify.command).toBe('appointment.create');
    expect(clarify.variable).toBe('customerName');
  });

  it('caps the options, because forty names is not a clarification', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `c${i}`,
      name: 'John Smith',
    }));
    const clarify = clarifyFromEntityResolution(
      resolveEntity(many, 'John Smith'),
    )!;
    expect(clarify.options.length).toBeLessThanOrEqual(MAX_CLARIFY_OPTIONS);
  });

  it('always allows a typed answer, since the right one may not be listed', () => {
    const clarify = clarifyFromEntityResolution(
      resolveEntity([{ id: 'e9', name: 'Jo' }], 'John Smith'),
    )!;
    expect(clarify.allowsFreeText).toBe(true);
  });
});

describe('clarifyFromDateResolution', () => {
  const ctx = {
    now: new Date('2026-06-05T19:00:00Z'),
    timeZone: 'America/New_York',
  };

  it('offers both readings of a weekday that names today', () => {
    // §30: "Friday" said on a Friday.
    const clarify = clarifyFromDateResolution(
      resolveRelativeDate('friday', ctx),
      { command: 'appointment.create', variable: 'date' },
    )!;
    expect(clarify.reason).toBe('ambiguous_date');
    expect(clarify.options.map((o) => o.value)).toEqual([
      '2026-06-05',
      '2026-06-12',
    ]);
  });

  it('caps a whole week of options', () => {
    const clarify = clarifyFromDateResolution(
      resolveRelativeDate('next week', ctx),
    )!;
    expect(clarify.options.length).toBeLessThanOrEqual(MAX_CLARIFY_OPTIONS);
  });

  it('returns nothing for a resolved date', () => {
    expect(
      clarifyFromDateResolution(resolveRelativeDate('tomorrow', ctx)),
    ).toBeNull();
  });
});

describe('clarifyFromTimeResolution', () => {
  it('offers morning and evening for a bare hour', () => {
    // §31: "at 8" is 08:00 or 20:00 and the platform cannot tell.
    const clarify = clarifyFromTimeResolution(resolveTimeOfDay('at 8'))!;
    expect(clarify.reason).toBe('ambiguous_time');
    expect(clarify.options.map((o) => o.value)).toEqual(['08:00', '20:00']);
  });

  it('returns nothing when the meridiem was explicit', () => {
    expect(clarifyFromTimeResolution(resolveTimeOfDay('at 8 pm'))).toBeNull();
  });
});

describe('clarifyFromPlanProblems', () => {
  const problem = (overrides: Partial<PlanProblem>): PlanProblem => ({
    code: 'missing_variables',
    details: ['customerName'],
    ...overrides,
  });

  it('asks about a missing variable by name', () => {
    const clarify = clarifyFromPlanProblems([
      problem({ command: 'appointment.create' }),
    ])!;
    expect(clarify.reason).toBe('missing_variable');
    expect(clarify.question).toContain('customerName');
    expect(clarify.variable).toBe('customerName');
  });

  it('asks one question rather than listing everything wrong', () => {
    // The "I didn't understand" wall in production traces is what happens when
    // every problem is reported at once.
    const clarify = clarifyFromPlanProblems([
      problem({ command: 'appointment.create' }),
      problem({ code: 'low_confidence', command: 'appointment.cancel' }),
      problem({ code: 'unknown_command', command: 'patient.create' }),
    ])!;
    expect(clarify.reason).toBe('missing_variable');
  });

  it('prefers the answerable question over the dead end', () => {
    // A missing variable is something the user can supply; an absent command
    // is not, so asking about the former first is more likely to unblock them.
    const clarify = clarifyFromPlanProblems([
      problem({ code: 'unknown_command', command: 'patient.create' }),
      problem({ command: 'appointment.create' }),
    ])!;
    expect(clarify.reason).toBe('missing_variable');
  });

  it('names an unsupported command rather than asking about it', () => {
    // §15's headline case: there is no create-customer command, and no answer
    // the user could give would create one.
    const clarify = clarifyFromPlanProblems([
      problem({
        code: 'unknown_command',
        command: 'patient.create',
        details: [],
      }),
    ])!;
    expect(clarify.reason).toBe('unsupported_command');
    expect(clarify.question).toContain('patient.create');
    expect(clarify.options).toEqual([]);
  });

  it('returns nothing when there is nothing to ask', () => {
    expect(clarifyFromPlanProblems([])).toBeNull();
    expect(
      clarifyFromPlanProblems([problem({ code: 'unknown_variables' })]),
    ).toBeNull();
  });
});

describe('isClarifyResult', () => {
  it('recognises every flag currently in use', () => {
    // `clarify`, `needsClarification` and a structured request are all used
    // across the codebase; one definition stops each caller re-deriving it.
    expect(isClarifyResult({ details: { needsClarification: true } })).toBe(
      true,
    );
    expect(isClarifyResult({ details: { clarify: true } })).toBe(true);
    expect(
      isClarifyResult({ details: { clarifyRequest: { question: 'x' } } }),
    ).toBe(true);
    expect(isClarifyResult({ details: {} })).toBe(false);
    expect(isClarifyResult({})).toBe(false);
  });
});

describe('clarify is no longer swallowed by the guide fallback', () => {
  it('asks the question instead of offering a tour, for a known command', () => {
    // The AI-TODO Phase 6 bug: "Which booking should I mark as paid?" used to
    // come back with a product-guide walkthrough appended.
    expect(
      shouldAppendPostFailureGuideFallback({
        success: false,
        action: 'mark_paid',
        summary: 'Which booking should I mark as paid?',
        details: { needsClarification: true },
      } as never),
    ).toBe(false);
  });

  it('suppresses the tour for a structured clarify request too', () => {
    expect(
      shouldAppendPostFailureGuideFallback({
        success: false,
        action: 'appointment.create',
        summary: 'Which customer?',
        details: { clarifyRequest: { question: 'Which customer?' } },
      } as never),
    ).toBe(false);
  });

  it('still offers the tour when the platform has no question to ask', () => {
    // `unknown` means classification failed, so there is no targeted question
    // available and documentation is the most useful thing left. Narrowing the
    // fix to known commands is what keeps this working.
    expect(
      shouldAppendPostFailureGuideFallback({
        success: false,
        action: 'unknown',
        summary: "I didn't fully understand that.",
        details: {
          needsClarification: true,
          pipelineStage: 'unknown_intent_clarify',
        },
      } as never),
    ).toBe(true);
  });

  it('still offers the tour for an ordinary handler failure', () => {
    expect(
      shouldAppendPostFailureGuideFallback({
        success: false,
        action: 'book_nearest_slot',
        summary: 'No slot available',
        details: {},
      } as never),
    ).toBe(true);
  });
});

describe('the guide line is grammatical for noun-shaped labels', () => {
  it('recognises verb-leading labels', () => {
    expect(looksLikeVerbPhrase('open Services')).toBe(true);
    expect(looksLikeVerbPhrase('Enable online payment')).toBe(true);
    expect(looksLikeVerbPhrase('pick a service')).toBe(true);
  });

  it('recognises noun-shaped labels, which used to read as nonsense', () => {
    // "Here's how to packages on this page" — the AI-TODO grammar bug.
    expect(looksLikeVerbPhrase('packages')).toBe(false);
    expect(looksLikeVerbPhrase('Step 1')).toBe(false);
    expect(looksLikeVerbPhrase('online payments')).toBe(false);
  });
});
