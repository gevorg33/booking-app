import {
  E2E324_HY_HELPFUL_CONTROL,
  E2E324_HY_NOT_HELPFUL_CASES,
} from './ai-e2e324-hy-not-helpful.fixtures.js';
import {
  isGiveAiFeedbackPrompt,
  parseGiveAiFeedbackAspect,
  parseGiveAiFeedbackRating,
} from './ai-give-ai-feedback.util.js';

describe('e2e-bug.324 HY native "not helpful" rescues to give_ai_feedback', () => {
  it.each(E2E324_HY_NOT_HELPFUL_CASES)(
    'isGiveAiFeedbackPrompt is true for $id',
    ({ prompt }) => {
      expect(isGiveAiFeedbackPrompt(prompt)).toBe(true);
    },
  );

  it.each(E2E324_HY_NOT_HELPFUL_CASES)(
    'parseGiveAiFeedbackRating resolves "down" for $id',
    ({ prompt }) => {
      expect(parseGiveAiFeedbackRating(prompt)).toBe('down');
    },
  );

  it.each(E2E324_HY_NOT_HELPFUL_CASES)(
    'parseGiveAiFeedbackAspect resolves "negative" for $id',
    ({ prompt }) => {
      expect(parseGiveAiFeedbackAspect(prompt)).toBe('negative');
    },
  );

  // Note: parseGiveAiFeedbackRating/Aspect on this exact canonical phrase
  // depend on a pre-existing, separate bug in POSITIVE_CUE (filed as
  // e2e-bug.341 — not fixed here) — only isGiveAiFeedbackPrompt is asserted.
  it('does not steal the positive "Օգտակար էր" control from feedback detection', () => {
    expect(isGiveAiFeedbackPrompt(E2E324_HY_HELPFUL_CONTROL)).toBe(true);
  });

  it('does not regress the existing HY "Սխալ էր" / RU "Не полезно" negatives', () => {
    expect(parseGiveAiFeedbackRating('Սխալ էր')).toBe('down');
    expect(parseGiveAiFeedbackRating('Не полезно')).toBe('down');
  });
});
