import { describe, expect, it } from '@jest/globals';
import { CLARIFY_FOLLOWUP_NORMALIZATION_SCENARIOS } from './ai-clarify-followup-normalization.fixtures.js';
import {
  normalizeClarifyAnswerForValidation,
  normalizeClarifyFieldAnswer,
  normalizeClarifyFollowUpAnswer,
  normalizeClarifyFollowUpAnswers,
  normalizeClarifyFollowUpForMerge,
  normalizeClarifyLocaleDateTimePhrase,
} from './ai-clarify-followup-normalization.util.js';
import { validateInlineClarifyFollowUp } from './ai-inline-clarify-validation.util.js';

describe('ai-clarify-followup-normalization.util (n99-1.6)', () => {
  it.each(CLARIFY_FOLLOWUP_NORMALIZATION_SCENARIOS)('$id', (scenario) => {
    const normalized = scenario.field
      ? normalizeClarifyFieldAnswer(scenario.field, scenario.input)
      : normalizeClarifyFollowUpAnswer(scenario.input);
    expect(normalized).toBe(scenario.expectNormalized);

    if (scenario.expectValidDate) {
      expect(
        validateInlineClarifyFollowUp({
          field: 'date',
          answer: normalized,
        }).valid,
      ).toBe(true);
    }
    if (scenario.expectValidTime) {
      expect(
        validateInlineClarifyFollowUp({
          field: 'timeSlot',
          answer: normalized,
        }).valid,
      ).toBe(true);
    }
  });

  it('normalizeClarifyFollowUpAnswers normalizes per field', () => {
    expect(
      normalizeClarifyFollowUpAnswers({
        employeeName: 'Աննա',
        date: 'վաղը',
        timeSlot: 'ժամը 10:00',
      }),
    ).toEqual({
      employeeName: 'Աննա',
      date: 'tomorrow',
      timeSlot: '10:00',
    });
  });

  it('normalizeClarifyAnswerForValidation handles hy date phrase in free text', () => {
    expect(normalizeClarifyAnswerForValidation('վաղը ժամը 10:00', 'date')).toBe(
      'tomorrow',
    );
  });

  it('normalizeClarifyFollowUpForMerge preserves Armenian merged prompt', () => {
    expect(normalizeClarifyFollowUpForMerge('վաղը ժամը 10:00')).toBe(
      'վաղը ժամը 10:00',
    );
  });

  it('normalizeClarifyLocaleDateTimePhrase maps translit tomorrow', () => {
    expect(normalizeClarifyLocaleDateTimePhrase('vagh@ at 2pm')).toContain(
      'tomorrow',
    );
  });
});
