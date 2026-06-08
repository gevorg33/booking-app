import { describe, expect, it } from '@jest/globals';
import {
  INLINE_CLARIFY_FOLLOWUP_GATE_SCENARIOS,
  INLINE_CLARIFY_VALIDATION_SCENARIOS,
} from './ai-inline-clarify-validation.fixtures.js';
import {
  buildInvalidClarifyFollowUpResult,
  rejectInvalidClarifyFollowUpIfNeeded,
  validateClarifyFollowUpAnswers,
  validateInlineClarifyFollowUp,
} from './ai-inline-clarify-validation.util.js';

describe('ai-inline-clarify-validation.util (n99-1.5)', () => {
  it.each(INLINE_CLARIFY_VALIDATION_SCENARIOS)('$id', (scenario) => {
    const result = validateInlineClarifyFollowUp({
      field: scenario.field,
      answer: scenario.answer,
      timeZone: scenario.timeZone,
    });
    expect(result.valid).toBe(scenario.expectValid);
    if (scenario.expectHint) {
      expect(result.hint).toBe(scenario.expectHint);
    }
  });

  it.each(INLINE_CLARIFY_FOLLOWUP_GATE_SCENARIOS)('$id follow-up gate', (scenario) => {
    const result = validateClarifyFollowUpAnswers({
      prompt: scenario.prompt,
      sessionContext: scenario.sessionContext,
      timeZone: scenario.timeZone,
    });
    expect(result.valid).toBe(scenario.expectValid);
    if (scenario.expectHint) {
      expect(result.hint).toBe(scenario.expectHint);
    }
  });

  it('rejectInvalidClarifyFollowUpIfNeeded returns clarify result with hint', () => {
    const rejected = rejectInvalidClarifyFollowUpIfNeeded({
      prompt: 'maybe sometime',
      surface: 'dashboard',
      sessionContext: {
        _clarifyContext: {
          originalPrompt: 'book massage',
          originalAction: 'create_booking',
          partialParams: { serviceName: 'Massage' },
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
          clarifyFields: ['date'],
        },
      },
    });
    expect(rejected).not.toBeNull();
    expect(rejected?.details.inlineValidationRejected).toBe(true);
    expect(rejected?.details.needsClarification).toBe(true);
    expect(rejected?.summary).toMatch(/specific date/i);
  });

  it('buildInvalidClarifyFollowUpResult preserves session context', () => {
    const sessionContext = {
      _clarifyContext: {
        originalPrompt: 'book color',
        originalAction: 'create_booking',
        partialParams: { employeeName: 'Sam' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
        clarifyFields: ['date'],
      },
    };
    const result = buildInvalidClarifyFollowUpResult({
      validation: {
        valid: false,
        hint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
        rejectedField: 'date',
      },
      sessionContext,
      surface: 'dashboard',
    });
    expect(result.details.sessionContext).toEqual(sessionContext);
    expect(result.details.clarifyContext).toMatchObject({
      originalAction: 'create_booking',
      clarifyRound: 1,
    });
  });
});
